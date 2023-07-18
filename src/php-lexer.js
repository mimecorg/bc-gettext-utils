const lookaheadLexer = require( './lookahead-lexer' );
const { Token, Language } = require( './consts' );

function phpLexer( text, codeLexer ) {
  let pos = 0;
  let line = 1;

  let nextLF = text.indexOf( '\n' );

  let childLexer = null;

  const { next, peek, skip } = lookaheadLexer( getToken );

  const startTagRegExp = /<\?(?:php|=)/g;

  function getToken() {
    if ( childLexer != null )
      return getChildToken();

    if ( pos >= text.length )
      return { token: Token.EOF };

    while ( nextLF >= 0 && pos > nextLF ) {
      nextLF = text.indexOf( '\n', nextLF + 1 );
      line++;
    }

    startTagRegExp.lastIndex = pos;

    const startTag = startTagRegExp.exec( text );

    if ( startTag != null ) {
      if ( startTag.index == pos ) {
        pos += startTag[ 0 ].length;
        childLexer = codeLexer( text.slice( pos ), Language.PHP );
        return { token: Token.CodeStart };
      }
      const value = text.slice( pos, startTag.index );
      pos = startTag.index;
      return { token: Token.Text, value, line };
    }

    const value = text.slice( pos );
    pos = text.length;
    return { token: Token.Text, value, line };
  }

  function getChildToken() {
    const token = childLexer.next();

    if ( token.token == Token.EOF || token.token == Token.CodeEnd ) {
      pos += childLexer.pos;
      childLexer = null;
    }

    if ( token.line != null )
      token.line += line - 1;

    return token;
  }

  return {
    next,
    peek,
    skip,
  };
}

module.exports = phpLexer;
