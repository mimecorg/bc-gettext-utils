const { Token } = require("./consts");

function codeExtractor( lexer, { insideCode = true, extractAttributes = false } = {}, options = {} ) {
  const {
    string = '_',
    particularString = '_p',
    pluralString = '_n',
    particularPluralString = '_pn',
    displayAttribute = 'Display',
    errorMessageProperty = 'ErrorMessage',
    reverseContext = false,
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
        if ( matches( string, token.value ) ) {
          const args = extractArguments( 1 );
          if ( args != null )
            return { line: token.line, msgid: args[ 0 ] };
        } else if ( matches( particularString, token.value ) ) {
          const args = extractArguments( 2 );
          if ( args != null ) {
            if ( reverseContext )
              return { line: token.line, msgctxt: args[ 1 ], msgid: args[ 0 ] };
            return { line: token.line, msgctxt: args[ 0 ], msgid: args[ 1 ] };
          }
        } else if ( matches( pluralString, token.value ) ) {
          const args = extractArguments( 2 );
          if ( args != null )
            return { line: token.line, msgid: args[ 0 ], msgid_plural: args[ 1 ] };
        } else if ( matches( particularPluralString, token.value ) ) {
          if ( reverseContext ) {
            const args = extractArgumentsReverseContext();
            if ( args != null )
              return { line: token.line, msgctxt: args[ 2 ], msgid: args[ 0 ], msgid_plural: args[ 1 ] };
          } else {
            const args = extractArguments( 3 );
            if ( args != null )
              return { line: token.line, msgctxt: args[ 0 ], msgid: args[ 1 ], msgid_plural: args[ 2 ] };
          }
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

  function extractArgumentsReverseContext() {
    const args = extractArguments( 2 );

    if ( args == null )
      return null;

    let token = lexer.peek();

    if ( token.token != Token.Operator || token.value != ',' )
      return null;

    lexer.skip();

    while ( true ) {
      token = lexer.peek();
      if ( token.token == Token.CodeEnd || token.token == Token.EOF || token.token == Token.Operator && token.value == ')' )
        return null;

      if ( token.token == Token.Operator && token.value == ',' )
        break;

      lexer.skip();
    }

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

    return args;
  }

  function extractAttributeProperties() {
    const properties = {};

    let parentheses = 0;

    while ( true ) {
      const token = lexer.next();

      if ( token.token == Token.EOF )
        break;

      if ( token.token == Token.Operator && token.value == '(' )
        parentheses++;

      if ( token.token == Token.Operator && token.value == ')' ) {
        if ( parentheses == 0 )
          break;
        else
          parentheses--;
      }

      if ( token.token == Token.Identifier && parentheses == 0 ) {
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

  function matches( names, value ) {
    if ( Array.isArray( names ) )
      return names.includes( value );
    return names == value;
  }

  return {
    next,
  };
}

module.exports = codeExtractor;
