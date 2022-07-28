function lookaheadLexer( getToken ) {
  const tokens = [];

  let lastToken = null;

  function next() {
    if ( tokens.length == 0 )
      pushToken();
    return shiftToken();
  }

  function peek( n = 0 ) {
    while ( tokens.length <= n )
      pushToken();
    return tokens[ n ];
  }

  function skip( n = 1 ) {
    while ( tokens.length <= n )
      pushToken();
    while ( n-- > 0 )
      shiftToken();
  }

  function pushToken() {
    while ( true ) {
      const token = getToken();

      if ( token != null ) {
        if ( Array.isArray( token ) )
          tokens.push( ...token );
        else
          tokens.push( token );
        break;
      }
    }
  }

  function shiftToken() {
    if ( tokens.length == 1 )
      lastToken = tokens[ 0 ];
    return tokens.shift();
  }

  function getLastToken() {
    if ( tokens.length > 0 )
      return tokens[ text.length - 1 ];
    return lastToken;
  }

  return {
    next,
    peek,
    skip,
    getLastToken,
  };
}

module.exports = lookaheadLexer;
