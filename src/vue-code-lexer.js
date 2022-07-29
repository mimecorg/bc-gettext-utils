const lookaheadLexer = require('./lookahead-lexer');
const { Token, Language } = require( './consts' );

function vueCodeLexer( text, vueLexer, codeLexer ) {
  const lexer = vueLexer( text );

  let childLexer = null;
  let childStartLine = null;

  const { next, peek, skip } = lookaheadLexer( getToken );

  function getToken() {
    if ( childLexer != null )
      return getChildToken();

    while ( true ) {
      const token = lexer.next();

      if ( token.token == Token.EOF )
        return token;

      if ( token.token == Token.TagStart && token.value.toLowerCase() == '<script' ) {
        while ( true ) {
          const t1 = lexer.peek();
          if ( t1.token == Token.EOF )
            break;
          if ( t1.token == Token.TagEnd ) {
            const t2 = lexer.peek( 1 );
            if ( t2.token == Token.Text ) {
              lexer.skip( 2 );
              childLexer = codeLexer( t2.value, Language.JavaScript );
              childStartLine = t2.line;
              return { token: Token.CodeStart };
            }
            break;
          }
          lexer.skip();
        }
      }

      if ( token.token == Token.Interpolation ) {
        childLexer = codeLexer( token.value, Language.JavaScript );
        childStartLine = token.line;
        return { token: Token.CodeStart };
      }

      if ( token.token == Token.Identifier ) {
        if ( token.value.startsWith( ':' ) || token.value.startsWith( 'v-bind:' ) || token.value == 'v-bind' ) {
          const t1 = lexer.peek( 0 );
          const t2 = lexer.peek( 1 );
          if ( t1.token == Token.Operator && t1.value == '=' && t2.token == Token.String ) {
            lexer.skip( 2 );
            childLexer = codeLexer( t2.value, Language.JavaScript );
            childStartLine = t2.line;
            return { token: Token.CodeStart };
          }
        }
      }
    }
  }

  function getChildToken() {
    const token = childLexer.next();

    if ( token.token == Token.EOF ) {
      childLexer = null;
      return { token: Token.CodeEnd };
    }

    if ( token.line != null )
      token.line += childStartLine - 1;

    return token;
  }

  return {
    next,
    peek,
    skip,
  };
}

module.exports = vueCodeLexer;
