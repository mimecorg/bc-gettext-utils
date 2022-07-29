const { Token } = require("./consts");

function codeExtractor( lexer, insideCode = true, options = {} ) {
  const {
    string = '_',
    particularString = '_p',
    pluralString = '_n',
    particularPluralString = '_pn',
  } = options;

  function next() {
    while ( true ) {
      const token = lexer.next();

      if ( token.token == Token.EOF )
        return null;

      if ( token.token == Token.CodeStart )
        insideCode = true;

      if ( token.token == Token.CodeEnd )
        insideCode = false;

      if ( insideCode && token.token == Token.Identifier ) {
        let args;
        switch ( token.value ) {
          case string:
            args = extractArguments( 1 );
            if ( args != null )
              return { line: token.line, msgid: args[ 0 ] };
            break;
          case particularString:
            args = extractArguments( 2 );
            if ( args != null )
              return { line: token.line, msgctxt: args[ 0 ], msgid: args[ 1 ] };
            break;
          case pluralString:
            args = extractArguments( 2 );
            if ( args != null )
              return { line: token.line, msgid: args[ 0 ], msgid_plural: args[ 1 ] };
            break;
          case particularPluralString:
            args = extractArguments( 3 );
            if ( args != null )
              return { line: token.line, msgctxt: args[ 0 ], msgid: args[ 1 ], msgid_plural: args[ 2 ] };
            break;
        }
      }
    }
  }

  function extractArguments( count ) {
    const args = [];

    let operator = '(';

    for ( let i = 0; i < count; i++ ) {
      let token = lexer.peek();
      if ( token.token != Token.Operator || token.value != operator )
        return null;

      lexer.skip();

      let arg = '';

      while ( true ) {
        token = lexer.peek();
        if ( token.token != Token.String )
          return null;

        arg += token.value;
        lexer.skip();

        token = lexer.peek();
        if ( token.token != Token.Operator || token.value != '+' )
          break;

        lexer.skip();
      }

      args.push( arg );

      operator = ',';
    }

    return args;
  }

  return {
    next,
  };
}

module.exports = codeExtractor;
