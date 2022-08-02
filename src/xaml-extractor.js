const { Token } = require("./consts");

function xamlExtractor( lexer, options = {} ) {
  const {
    extensions = [ 'i18n:Translate', 'i18n:Format', 'i18n:MultiFormat' ],
    textAttribute = 'Text',
    pluralTextAttribute = 'PluralText',
    contextAttribute = 'Context',
  } = options;

  function next() {
    while ( true ) {
      const token = lexer.next();

      if ( token.token == Token.EOF )
        return null;

      if ( token.token == Token.ExtensionStart ) {
        for ( const extension of extensions ) {
          if ( token.value == extension ) {
            const result = extractFromExtension();
            if ( result != null )
              return { line: token.line, ...result };
          }
        }
      }

      if ( token.token == Token.TagStart ) {
        for ( const extension of extensions ) {
          if ( token.value.slice( 1 ) == extension ) {
            const result = extractFromTag( extension );
            if ( result != null )
              return { line: token.line, ...result };
          }
        }
      }
    }
  }

  function extractFromExtension() {
    let text = null;
    let pluralText = null;
    let context = null;

    let token = lexer.peek();

    if ( token.token == Token.String ) {
      const t2 = lexer.peek( 1 );

      if ( t2.token == Token.ExtensionEnd || t2.token == Token.Operator && t2.value == ',' ) {
        lexer.skip( 2 );
        text = token.value;
        token = lexer.peek();
      } else {
        return null;
      }

      if ( t2.token == Token.ExtensionEnd )
        return { msgid: text };
    }

    while ( true ) {
      if ( token.token == Token.Identifier ) {
        const t2 = lexer.peek( 1 );
        const t3 = lexer.peek( 2 );
        const t4 = lexer.peek( 3 );

        if ( t2.token == Token.Operator && t2.value == '=' && t3.token == Token.String && ( t4.token == Token.ExtensionEnd || t4.token == Token.Operator && t4.value == ',' ) ) {
          lexer.skip( 4 );

          if ( token.value == textAttribute && text == null )
            text = t3.value;
          else if ( token.value == pluralTextAttribute && pluralText == null )
            pluralText = t3.value;
          else if ( token.value == contextAttribute && context == null )
            context = t3.value;

          if ( t4.token == Token.ExtensionEnd )
            return makeResult( text, pluralText, context );

          token = lexer.peek();
          continue;
        }
      }

      return null;
    }
  }

  function extractFromTag( extension ) {
    let text = null;
    let pluralText = null;
    let context = null;

    while ( true ) {
      const token = lexer.peek();

      if ( token.token == Token.Identifier ) {
        const t2 = lexer.peek( 1 );
        const t3 = lexer.peek( 2 );

        if ( t2.token == Token.Operator && t2.value == '=' && t3.token == Token.String ) {
          lexer.skip( 3 );
          if ( token.value == textAttribute && text == null )
            text = t3.value;
          else if ( token.value == pluralTextAttribute && pluralText == null )
            pluralText = t3.value;
          else if ( token.value == contextAttribute && context == null )
            context = t3.value;
          continue;
        }
      }

      if ( token.token == Token.TagEnd ) {
        lexer.skip();

        if ( token.value == '/>' )
          return makeResult( text, pluralText, context );

        break;
      }

      return null;
    }

    while ( true ) {
      const token = lexer.peek();

      if ( token.token == Token.Text && text == null ) {
        lexer.skip();
        text = token.value.trim();
        continue;
      }

      if ( token.token == Token.TagStart ) {
        if ( token.value == `</${extension}` ) {
          lexer.skip();
          return makeResult( text, pluralText, context );
        }

        if ( token.value.startsWith( `<${extension}.` ) ) {
          const attribute = token.value.slice( extension.length + 2 );

          const t2 = lexer.peek( 1 );
          const t3 = lexer.peek( 2 );
          const t4 = lexer.peek( 3 );
          const t5 = lexer.peek( 4 );

          if ( t2.token == Token.TagEnd && t3.token == Token.Text && t4.token == Token.TagStart && t4.value == `</${extension}.${attribute}` && t5.token == Token.TagEnd ) {
            lexer.skip( 5 );
            if ( attribute == textAttribute && text == null )
              text = t3.value;
            else if ( attribute == pluralTextAttribute && pluralText == null )
              pluralText = t3.value;
            else if ( attribute == contextAttribute && context == null )
              context = t3.value;
            continue;
          }
        }
      }

      return null;
    }
  }

  function makeResult( text, pluralText, context ) {
    if ( text == null )
      return null;

    const result = { msgid: text };

    if ( pluralText != null )
      result.msgid_plural = pluralText;
    if ( context != null )
      result.msgctxt = context;

    return result;
  }

  return {
    next,
  };
}

module.exports = xamlExtractor;
