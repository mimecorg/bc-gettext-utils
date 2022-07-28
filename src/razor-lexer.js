const lookaheadLexer = require( './lookahead-lexer' );
const { Token, Language } = require( './consts' );

function razorLexer( text, codeLexer ) {
  let pos = 0;
  let line = 1;

  let nextLF = text.indexOf( '\n' );

  let insideTag = false;

  let childLexer = null;
  let childContext = null;

  const { next, peek, skip } = lookaheadLexer( getToken );

  const whitespaceRegExp = /\s+/y;

  const tagOrRazorRegExp = /<\/?[a-z][-a-z0-9]*|<!--.*?-->|@/gsi;
  const commentRegExp = /@\*.*?\*@/ys;
  const directiveRegExp = /@[_a-z][_a-z0-9]*/yi;
  const openBraceRegExp = /\s*{/y;
  const openParenthesisRegExp = /\s*\(/y;

  const idRegExp = /[a-z][-a-z0-9]*/yi;
  const numberRegExp = /[0-9]+/y
  const singleQuoteStringRegExp = /'.*?'/ys;
  const doubleQuoteStringRegExp = /".*?"/ys;

  const directives = [
    '@attribute', '@implements', '@inherits', '@inject', '@layout', '@model', '@namespace', '@page',
    '@preservewhitespace', '@using', '@addTagHelper', '@removeTagHelper', '@tagHelperPrefix',
  ];

  const selfClosingTags = [ 'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr' ];

  function getToken() {
    if ( childLexer != null )
      return getChildToken();

    if ( insideTag )
      exec( whitespaceRegExp );

    if ( pos >= text.length )
      return { token: Token.EOF };

    while ( nextLF >= 0 && pos > nextLF ) {
      nextLF = text.indexOf( '\n', nextLF + 1 );
      line++;
    }

    if ( insideTag )
      return getTagToken();
    else
      return getTextToken();
  }

  function getTextToken() {
    tagOrRazorRegExp.lastIndex = pos;

    const tagOrRazor = tagOrRazorRegExp.exec( text );

    if ( tagOrRazor != null ) {
      if ( tagOrRazor.index == pos ) {
        const value = tagOrRazor[ 0 ];
        if ( value[ 0 ] == '<' ) {
          pos = tagOrRazorRegExp.lastIndex;
          if ( value[ 1 ] == '!' )
            return null;
          insideTag = true;
          return { token: Token.TagStart, value, line };
        } else {
          return getRazorToken();
        }
      }

      const value = text.slice( pos, tagOrRazor.index );
      pos = tagOrRazor.index;
      return { token: Token.Text, value, line };
    }

    const value = text.slice( pos );
    pos = text.length;
    return { token: Token.Text, value, line };
  }

  function getTagToken() {
    const id = exec( idRegExp );

    if ( id != null )
      return { token: Token.Identifier, value: id[ 0 ], line };

    const number = exec( numberRegExp );

    if ( number != null )
      return { token: Token.Number, value: number[ 0 ], line };

    if ( text[ pos ] == "'" ) {
      const string = exec( singleQuoteStringRegExp );
      if ( string != null )
        return { token: Token.String, delimiter: "'", value: string[ 0 ].slice( 1, -1 ), line };
    }

    if ( text[ pos ] == '"' ) {
      const string = exec( doubleQuoteStringRegExp );
      if ( string != null )
        return { token: Token.String, delimiter: '"', value: string[ 0 ].slice( 1, -1 ), line };
    }

    if ( text[ pos ] == '>' ) {
      pos++;
      insideTag = false;
      return { token: Token.TagEnd, value: '>', line };
    }

    if ( text[ pos ] == '/' && text[ pos + 1 ] == '>' ) {
      pos += 2;
      insideTag = false;
      return { token: Token.TagEnd, value: '/>', line };
    }

    if ( text[ pos ] == '@' )
        return getRazorToken();

    return { token: Token.Operator, value: text[ pos++ ], line };
  }

  function getRazorToken() {
    if ( text[ pos + 1 ] == '@' ) {
      pos += 2;
      return { token: insideTag ? Token.Operator : Token.Text, value: '@', line };
    }

    if ( text[ pos + 1 ] == '*' ) {
      if ( exec( commentRegExp ) != null )
        return null;
    }

    if ( text[ pos + 1 ] == '{' || text[ pos + 1 ] == '(' ) {
      pos++;
      childLexer = codeLexer( text.slice( pos ), Language.CSharp, razorLexer );
      return { token: Token.CodeStart };
    }

    directiveRegExp.lastIndex = pos;
    const directive = directiveRegExp.exec( text );
    if ( directive != null ) {
      if ( directive[ 0 ] == '@functions' ) {
        pos = directiveRegExp.lastIndex;
        openBraceRegExp.lastIndex = directiveRegExp.lastIndex;
        if ( openBraceRegExp.exec( text ) != null ) {
          childLexer = codeLexer( text.slice( pos ), Language.CSharp, razorLexer );
          return { token: Token.CodeStart };
        } else {
          return { token: Token.Directive, value: directive[ 0 ], line };
        }
      }

      if ( directive[ 0 ] == '@section' ) {
        pos = directiveRegExp.lastIndex;
        return { token: Token.Directive, value: directive[ 0 ], line };
      }

      if ( directive[ 0 ] == '@using' ) {
        openParenthesisRegExp.lastIndex = directiveRegExp.lastIndex;
        if ( openParenthesisRegExp.exec( text ) != null ) {
          pos++;
          childLexer = codeLexer( text.slice( pos ), Language.CSharp, razorLexer );
          return { token: Token.CodeStart };
        }
      }

      if ( directives.includes( directive[ 0 ] ) ) {
        if ( nextLF > 0 ) {
          const value = text.slice( pos, nextLF );
          pos = nextLF;
          return { token: Token.Directive, value, line };
        }

        const value = text.slice( pos );
        pos = text.length;
        return { token: Token.Directive, value, line };
      }

      pos++;
      childLexer = codeLexer( text.slice( pos ), Language.CSharp, razorLexer );
      return { token: Token.CodeStart };
    }

    pos++;
    return { token: insideTag ? Token.Operator : Token.Text, value: '@', line };
  }

  function createContext() {
    return {
      stack: [],
      closing: false,
    };
  }

  function updateContext( context, token ) {
    if ( token.token == Token.TagStart ) {
      if ( token.value[ 1 ] != '/' ) {
        const tag = token.value.slice( 2 ).toLowerCase();
        if ( !selfClosingTags.includes( tag ) )
          context.stack.push( tag );
      } else {
        const tag = token.value.slice( 3 ).toLowerCase();
        while ( context.stack.length > 0 ) {
          const last = context.stack.pop();
          if ( tag == last )
            break;
        }
        if ( context.stack.length == 0 )
          context.closing = true;
      }
    }

    if ( token.token == Token.TagEnd && context.closing )
      return false;

    return true;
  }

  function getChildToken() {
    const token = childLexer.next();

    if ( token.token == Token.EOF ) {
      childLexer = null;
      pos = text.length;
      return token;
    }

    if ( token.line != null )
      token.line += line - 1;

    if ( childContext == null )
      childContext = childLexer.createContext( token );

    if ( !childLexer.updateContext( childContext, token ) ) {
      pos += childLexer.pos;
      line += childLexer.line - 1;
      nextLF = text.indexOf( '\n', pos );
      childLexer = null;
      childContext = null;
      return [ token, { token: Token.CodeEnd } ];
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

module.exports = razorLexer;
