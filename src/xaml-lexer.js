const lookaheadLexer = require('./lookahead-lexer');
const { Token } = require( './consts' );

function xamlLexer( text ) {
  let pos = 0;
  let line = 1;

  let nextLF = text.indexOf( '\n' );

  let insideTag = false;

  let insideExtension = false;
  let inSingleQuotes = false;
  let inDoubleQuotes = false;

  const { next, peek, skip } = lookaheadLexer( getToken );

  const whitespaceRegExp = /\s+/y;

  const tagRegExp = /<\/?(?:[a-z][-a-z0-9]*:)?(?:[a-z][-a-z0-9]*\.)?[a-z][-a-z0-9]*|<!--.*?-->/gsi;

  const idRegExp = /(?:[a-z][-a-z0-9]*:)?[a-z][-a-z0-9]*/yi;
  const singleQuoteStringRegExp = /'.*?'/ys;
  const doubleQuoteStringRegExp = /".*?"/ys;
  const extensionRegExp = /{\s*((?:[a-z][-a-z0-9]*:)?[a-z][-a-z0-9]*)/ysi;
  const extensionIdRegExp = /(?:[a-z][-a-z0-9]*:)?[a-z][-a-z0-9]*(?=\s*=)/yi;
  const extensionStringRegExp = /[^,={}'"\s]+(\s+[^,={}'"\s]+)*/yi;

  function getToken() {
    if ( insideTag || insideExtension )
      exec( whitespaceRegExp );

    if ( pos >= text.length )
      return { token: Token.EOF };

    while ( nextLF >= 0 && pos > nextLF ) {
      nextLF = text.indexOf( '\n', nextLF + 1 );
      line++;
    }

    if ( insideExtension )
      return getExtensionToken();
    else if ( insideTag )
      return getTagToken();
    else
      return getTextToken();
  }

  function getTextToken() {
    tagRegExp.lastIndex = pos;

    const tag = tagRegExp.exec( text );

    if ( tag != null ) {
      if ( tag.index == pos ) {
        const value = tag[ 0 ];
        pos = tagRegExp.lastIndex;
        if ( value[ 1 ] == '!' )
          return null;
        if ( value[ 1 ] != '/' )
          lastOpeningTag = value.slice( 1 ).toLowerCase();
        else
          lastOpeningTag = null;
        insideTag = true;
        return { token: Token.TagStart, value, line };
      }

      const value = text.slice( pos, tag.index );
      pos = tag.index;
      if ( value.trim() == '' )
        return null;
      return { token: Token.Text, value, line };
    }

    const value = text.slice( pos );
    pos = text.length;
    if ( value.trim() == '' )
      return null;
    return { token: Token.Text, value, line };
  }

  function getTagToken() {
    const id = exec( idRegExp );

    if ( id != null )
      return { token: Token.Identifier, value: id[ 0 ], line };

    if ( text[ pos ] == "'" ) {
      singleQuoteStringRegExp.lastIndex = pos;
      const string = singleQuoteStringRegExp.exec( text );
      if ( string != null ) {
        pos++;
        const extension = exec( extensionRegExp );
        if ( extension != null ) {
          insideExtension = true;
          inSingleQuotes = true;
          return { token: Token.ExtensionStart, value: extension[ 1 ], line };
        } else {
          pos = singleQuoteStringRegExp.lastIndex;
          return { token: Token.String, delimiter: "'", value: unquoteString( string[ 0 ] ), line };
        }
      }
    }

    if ( text[ pos ] == '"' ) {
      doubleQuoteStringRegExp.lastIndex = pos;
      const string = doubleQuoteStringRegExp.exec( text );
      if ( string != null ) {
        pos++;
        const extension = exec( extensionRegExp );
        if ( extension != null ) {
          insideExtension = true;
          inDoubleQuotes = true;
          return { token: Token.ExtensionStart, value: extension[ 1 ], line };
        } else {
          pos = doubleQuoteStringRegExp.lastIndex;
          return { token: Token.String, delimiter: '"', value: unquoteString( string[ 0 ] ), line };
        }
      }
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

    return { token: Token.Operator, value: text[ pos++ ], line };
  }

  function getExtensionToken() {
    if ( text[ pos ] == '{' ) {
      const extension = exec( extensionRegExp );
      if ( extension != null )
        return { token: Token.ExtensionStart, value: extension[ 1 ], line };
    }

    if ( text[ pos ] == '}' ) {
      pos++;
      return { token: Token.ExtensionEnd, line };
    }

    if ( text[ pos ] == "'" ) {
      if ( inSingleQuotes ) {
        pos++;
        inSingleQuotes = false;
        if ( !inSingleQuotes && !inDoubleQuotes )
          insideExtension = false;
        return null;
      }

      singleQuoteStringRegExp.lastIndex = pos;
      const string = singleQuoteStringRegExp.exec( text );
      if ( string != null ) {
        pos++;
        const extension = exec( extensionRegExp );
        if ( extension != null ) {
          inSingleQuotes = true;
          return { token: Token.ExtensionStart, value: extension[ 1 ], line };
        } else {
          pos = singleQuoteStringRegExp.lastIndex;
          return { token: Token.String, delimiter: "'", value: unquoteString( string[ 0 ] ), line };
        }
      }
    }

    if ( text[ pos ] == '"' ) {
      if ( inDoubleQuotes ) {
        pos++;
        inDoubleQuotes = false;
        if ( !inSingleQuotes && !inDoubleQuotes )
          insideExtension = false;
        return null;
      }

      doubleQuoteStringRegExp.lastIndex = pos;
      const string = doubleQuoteStringRegExp.exec( text );
      if ( string != null ) {
        pos++;
        const extension = exec( extensionRegExp );
        if ( extension != null ) {
          inDoubleQuotes = true;
          return { token: Token.ExtensionStart, value: extension[ 1 ], line };
        } else {
          pos = doubleQuoteStringRegExp.lastIndex;
          return { token: Token.String, delimiter: '"', value: unquoteString( string[ 0 ] ), line };
        }
      }
    }

    const id = exec( extensionIdRegExp );
    if ( id != null )
      return { token: Token.Identifier, value: id[ 0 ], line };

    const string = exec( extensionStringRegExp );
    if ( string != null )
      return { token: Token.String, value: string[ 0 ], delimiter: '', line };

    return { token: Token.Operator, value: text[ pos++ ], line };
  }

  function unquoteString( value ) {
    value = value.slice( 1, -1 );
    if ( value.length >= 2 && value[ 0 ] == '{' && value[ 1 ] == '}' )
      value = value.slice( 2 );
    return value;
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
  };
}

module.exports = xamlLexer;
