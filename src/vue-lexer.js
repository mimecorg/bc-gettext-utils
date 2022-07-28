const lookaheadLexer = require('./lookahead-lexer');
const { Token } = require( './consts' );

function vueLexer( text ) {
  let pos = 0;
  let line = 1;

  let nextLF = text.indexOf( '\n' );

  let insideTag = false;
  let lastOpeningTag = null;

  const { next, peek, skip } = lookaheadLexer( getToken );

  const whitespaceRegExp = /\s+/y;

  const tagOrInterpolationRegExp = /<\/?[a-z][-a-z0-9]*|<!--.*?-->|{{.*?}}/gsi;

  const idRegExp = /(?:[:@#]|[a-z][-a-z0-9]*:)?[a-z][-a-z0-9]*/yi;
  const numberRegExp = /[0-9]+/y
  const singleQuoteStringRegExp = /'.*?'/ys;
  const doubleQuoteStringRegExp = /".*?"/ys;

  function getToken() {
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
    else if ( lastOpeningTag == 'script' || lastOpeningTag == 'style' )
      return getRawTextToken();
    else
      return getTextToken();
  }

  function getTextToken() {
    tagOrInterpolationRegExp.lastIndex = pos;

    const tagOrInterpolation = tagOrInterpolationRegExp.exec( text );

    if ( tagOrInterpolation != null ) {
      if ( tagOrInterpolation.index == pos ) {
        const value = tagOrInterpolation[ 0 ];
        pos = tagOrInterpolationRegExp.lastIndex;
        if ( value[ 0 ] == '<' ) {
          if ( value[ 1 ] == '!' )
            return null;
          if ( value[ 1 ] != '/' )
            lastOpeningTag = value.slice( 1 ).toLowerCase();
          else
            lastOpeningTag = null;
          insideTag = true;
          return { token: Token.TagStart, value, line };
        } else {
          return { token: Token.Interpolation, value: value.slice( 2, -2 ), line };
        }
      }

      const value = text.slice( pos, tagOrInterpolation.index );
      pos = tagOrInterpolation.index;
      return { token: Token.Text, value, line };
    }

    const value = text.slice( pos );
    pos = text.length;
    return { token: Token.Text, value, line };
  }

  function getRawTextToken() {
    const closingTagRegExp = new RegExp( '<\/' + lastOpeningTag + '\\s*>', 'i' );
    closingTagRegExp.lastIndex = pos;

    const closingTag = closingTagRegExp.exec( text );

    if ( closingTag != null ) {
      if ( closingTag.index == pos ) {
        const value = text.slice( pos, pos + 2 + lastOpeningTag.length );
        pos += value.length;
        insideTag = true;
        lastOpeningTag = null;
        return { token: Token.TagStart, value, line };
      } else {
        const value = text.slice( pos, closingTag.index );
        pos = closingTag.index;
        return { token: Token.Text, value, line };
      }
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

    return { token: Token.Operator, value: text[ pos++ ], line };
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

module.exports = vueLexer;
