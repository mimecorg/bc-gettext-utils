const { Token } = require("./consts");

function codeExtractor( lexer, { insideCode = true, extractAttributes = false } = {}, options = {} ) {
  const {
    string = '_',
    particularString = '_p',
    pluralString = '_n',
    particularPluralString = '_pn',
    displayAttribute = 'Display',
    errorMessageProperty = 'ErrorMessage',
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

      if ( insideCode && extractAttributes && token.token == Token.Operator && token.value == '[' ) {
        const t1 = lexer.peek();
        const t2 = lexer.peek( 1 );

        if ( t1.token == Token.Identifier && t2.token == Token.Operator && t2.value == '(' ) {
          lexer.skip( 2 );
          const properties = extractAttributeProperties();
          if ( t1.value == displayAttribute )
            return Object.values( properties );
          else if ( properties[ errorMessageProperty ] != null )
            return properties[ errorMessageProperty ];
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

  function extractAttributeProperties() {
    const properties = {};

    while ( true ) {
      const token = lexer.next();

      if ( token.token == Token.Operator && token.value == ')' || token.token == Token.EOF )
        break;

      if ( token.token == Token.Identifier ) {
        const t1 = lexer.peek();
        const t2 = lexer.peek( 1 );

        if ( t1.token == Token.Operator && t1.value == '=' && t2.token == Token.String ) {
          lexer.skip( 2 );
          properties[ token.value ] = { line: t1.line, msgid: t2.value };
        }
      }
    }

    return properties;
  }

  return {
    next,
  };
}

module.exports = codeExtractor;
