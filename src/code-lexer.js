const lookaheadLexer = require( './lookahead-lexer' );
const { Token, Language } = require( './consts' );

function codeLexer( text, language, razorLexer = null ) {
  let pos = 0;
  let line = 1;

  let nextLF = text.indexOf( '\n' );

  let childLexer = null;
  let childLineMode = false;
  let childContext = null;

  const { next, peek, skip, getLastToken } = lookaheadLexer( getToken );

  const whitespaceRegExp = /\s+/y;
  const idRegExp = /[_a-z][_a-z0-9]*/yi;
  const numberRegExp = /[0-9][_0-9]*/y;
  const multiLineCommentRegExp = /\/\*.*?\*\//ys;
  const singleLineCommentRegExp = /\/\/.*/y;
  const singleQuoteStringRegExp = /'(?:[^'\\]|\\.)*'/y;
  const doubleQuoteStringRegExp = /"(?:[^"\\]|\\.)*"/y;
  const verbatimStringRegExp = /@"(?:[^"]|"")*"/ys;
  const backQuoteStringRegExp = /`(?:[^`\\]|\\.)*`/ys;
  const regExpRegExp = /\/(?:[^\/\\]|\\.)+\/[a-z]*/y;
  const tagRegExp = /<[a-z]|<!--.*?-->|/ysi;
  const razorCommentRegExp = /@\*.*?\*@/ys;

  const memberRegExp = /.[_a-z][_a-z0-9]*/yi;
  const elseRegExp = /\s*else\b/y;
  const whileRegExp = /\s*while\b/y;
  const catchOrFinallyRegExp = /\s*(catch|finally)\b/y;

  function getToken() {
    if ( childLexer != null )
      return getChildToken();

    exec( whitespaceRegExp );

    if ( pos >= text.length )
      return { token: Token.EOF };

    while ( nextLF >= 0 && pos > nextLF ) {
      nextLF = text.indexOf( '\n', nextLF + 1 );
      line++;
    }

    const id = exec( idRegExp );

    if ( id != null )
      return { token: Token.Identifier, value: id[ 0 ], line };

    const number = exec( numberRegExp );

    if ( number != null )
      return { token: Token.Number, value: number[ 0 ], line };

    if ( text[ pos ] == '/' ) {
      if ( exec( multiLineCommentRegExp ) != null || exec( singleLineCommentRegExp ) != null )
        return null;

      if ( language == Language.JavaScript ) {
        const last = getLastToken();

        const afterOperand = last != null && ( last.token == Token.Identifier || last.token == Token.Number
          || last.token == Token.Operator && ( last.value == ')' || last.value == ']' || last.value == '}' || last.value == '.' ) );

        if ( !afterOperand ) {
          const regExp = exec( regExpRegExp );
          if ( regExp != null )
            return { token: Token.RegExp, value: regExp[ 0 ], line };
        }
      }
    }

    if ( text[ pos ] == "'" ) {
      const string = exec( singleQuoteStringRegExp );
      if ( string != null )
        return { token: Token.String, delimiter: "'", value: stripSlashes( string[ 0 ] ), line };
    }

    if ( text[ pos ] == '"' ) {
      const string = exec( doubleQuoteStringRegExp );
      if ( string != null )
        return { token: Token.String, delimiter: '"', value: stripSlashes( string[ 0 ] ), line };
    }

    if ( language == Language.CSharp && text[ pos ] == '@' ) {
      const string = exec( verbatimStringRegExp );
      if ( string != null )
        return { token: Token.String, delimiter: '@"', value: string[ 0 ].slice( 2, -1 ).replace( /""/g, '"' ), line };
    }

    if ( language == Language.JavaScript && text[ pos ] == '`' ) {
      const string = exec( backQuoteStringRegExp );
      if ( string != null )
        return { token: Token.String, delimiter: '`', value: stripSlashes( string[ 0 ] ), line };
    }

    if ( language == Language.JavaScript && text[ pos ] == '<' && text[ pos + 1 ] == '/' ) {
      pos += 2;
      return { token: Token.Operator, value: '</', line };
    }

    if ( language == Language.PHP ) {
      if ( text[ pos ] == '?' && text[ pos + 1 ] == '>' ) {
        pos += 2;
        return { token: Token.CodeEnd };
      }

      if ( text[ pos ] == '.' ) {
        pos++;
        return { token: Token.Operator, value: '+', line };
      }
    }

    if ( ( language == Language.JavaScript || language == Language.PHP ) && text[ pos ] == '$' ) {
      pos++;
      const id = exec( idRegExp );
      if ( id != null )
        return { token: Token.Identifier, value: '$' + id[ 0 ], line };
      return { token: Token.Operator, value: '$', line };
    }

    if ( language == Language.CSharp && razorLexer != null ) {
      if ( text[ pos ] == '<' || text[ pos ] == '@' && text[ pos + 1 ] == ':' ) {
        const last = getLastToken();

        if ( last != null && last.token == Token.Operator && ( last.value == '{' || last.value == '}' || last.value == ';' ) ) {
          if ( text[ pos ] == '<' ) {
            tagRegExp.lastIndex = pos;
            if ( tagRegExp.exec( text ) != null ) {
              if ( text[ pos + 1 ] == '!' ) {
                pos = tagRegExp.lastIndex;
                return null;
              }

              childLexer = razorLexer( text.slice( pos ), codeLexer );
              return { token: Token.CodeEnd };
            }
          }

          if ( text[ pos ] == '@' ) {
            pos += 2;
            if ( nextLF > 0 )
              childLexer = razorLexer( text.slice( pos, nextLF + 1 ), codeLexer );
            else
              childLexer = razorLexer( text.slice( pos ), codeLexer );
            childLineMode = true;
            return { token: Token.CodeEnd };
          }
        }
      }

      if ( text[ pos ] == '@' && text[ pos + 1 ] == '*' ) {
        if ( exec( razorCommentRegExp ) != null )
          return null;
      }
    }

    return { token: Token.Operator, value: text[ pos++ ], line };
  }

  function createContext( token ) {
    return {
      startToken: token,
      parentheses: 0,
      braces: 0,
      brackets: 0,
    };
  }

  function updateContext( context, token ) {
    if ( token.token == Token.Operator ) {
      if ( token.value == '(' )
        context.parentheses++;
      if ( token.value == '{' )
        context.braces++;
      if ( token.value == '[' )
        context.brackets++;

      if ( token.value == ')' ) {
        context.parentheses--;

        if ( context.parentheses == 0 && context.startToken.token == Token.Operator && context.startToken.value == '(' )
          return false;
      }

      if ( token.value == '}' ) {
        context.braces--;

        if ( context.braces == 0 && context.startToken.token == Token.Operator && context.startToken.value == '{' )
          return false;
      }

      if ( token.value == ']' )
        context.brackets--;
    }

    if ( context.startToken.token == Token.Identifier ) {
      const keyword = context.startToken.value;

      if ( keyword == 'await' && token == context.startToken )
        return true;

      if ( context.parentheses > 0 || context.brackets > 0 || context.braces > 0 )
        return true;

      if ( keyword == 'if' ) {
        if ( token.token == Token.Operator && ( token.value == ';' || token.value == '}' ) ) {
          elseRegExp.lastIndex = pos;
          if ( elseRegExp.exec( text ) == null )
            return false;
        }
        return true;
      }

      if ( keyword == 'switch' ) {
        if ( token.token == Token.Operator && token.value == '}' )
          return false;
        return true;
      }

      if ( keyword == 'for' || keyword == 'foreach' || keyword == 'while' || keyword == 'using' || keyword == 'lock' ) {
        if ( token.token == Token.Operator && ( token.value == ';' || token.value == '}' ) )
          return false;
        return true;
      }

      if ( keyword == 'do' ) {
        if ( token.token == Token.Operator && token.value == ';' ) {
          whileRegExp.lastIndex = pos;
          if ( whileRegExp.exec( text ) == null )
            return false;
        }
        return true;
      }

      if ( keyword == 'try' ) {
        if ( token.token == Token.Operator && token.value == '}' ) {
          catchOrFinallyRegExp.lastIndex = pos;
          if ( catchOrFinallyRegExp.exec( text ) == null )
            return false;
        }
        return true;
      }

      if ( token.token == Token.Identifier || token.token == Token.Operator && ( token.value == ')' || token.value == ']' || token.value == '}' ) ) {
        const ch = text[ pos ];
        if ( ch == '.' ) {
          memberRegExp.lastIndex = pos;
          if ( memberRegExp.exec( text ) != null )
            return true;
        }
        if ( ch == '(' || ch == '[' || ch == '{' )
          return true;
        return false;
      }
    }

    return true;
  }

  function getChildToken() {
    const token = childLexer.next();

    if ( token.token == Token.EOF ) {
      childLexer = null;
      if ( childLineMode && nextLF > 0 ) {
        childLineMode = false;
        pos = nextLF + 1;
        return { token: Token.CodeStart };
      } else {
        pos = text.length;
        return token;
      }
    }

    if ( token.line != null )
      token.line += line - 1;

    if ( !childLineMode ) {
      if ( childContext == null )
        childContext = childLexer.createContext( token );

      if ( !childLexer.updateContext( childContext, token ) ) {
        pos += childLexer.pos;
        line += childLexer.line - 1;
        nextLF = text.indexOf( '\n', pos );
        childLexer = null;
        childContext = null;
        return [ token, { token: Token.CodeStart } ];
      }
    }

    return token;
  }

  function exec( regExp ) {
    regExp.lastIndex = pos;
    const match = regExp.exec( text );
    if ( match != null )
      pos = regExp.lastIndex;
    return match;
  }

  function stripSlashes( value ) {
    value = value.slice( 1, -1 );
    value = value.replace( /\\./g, match => {
      switch ( match[ 1 ] ) {
        case 't':
          return '\t';
        case 'r':
          return '\r';
        case 'n':
          return '\n';
        default:
          return match[ 1 ];
      }
    } );
    return value;
  }

  return {
    next,
    peek,
    skip,
    createContext,
    updateContext,
    get pos() { return pos; },
    get line() { return line; },
  };
}

module.exports = codeLexer;
