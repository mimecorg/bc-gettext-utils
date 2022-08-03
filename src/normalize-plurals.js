function normalizePlurals( translations, nplurals = 2 ) {
  const normalizedTranslations = {};

  for ( const context in translations ) {
    normalizedTranslations[ context ] = {};

    for ( const msgid in translations[ context ] ) {
      const message = translations[ context ][ msgid ];

      if ( message.msgid_plural == null ) {
        if ( message.msgstr.length == 1 ) {
          normalizedTranslations[ context ][ msgid ] = message;
        } else {
          normalizedTranslations[ context ][ msgid ] = {
            ...message,
            msgstr: [ message.msgstr[ 0 ] ],
          };
        }
      } else {
        if ( message.msgstr.length == nplurals ) {
          normalizedTranslations[ context ][ msgid ] = message;
        } else {
          const msgstr = message.msgstr.slice( 0, nplurals );
          while( msgstr.length < nplurals )
            msgstr.push( '' );
          normalizedTranslations[ context ][ msgid ] = { ...message, msgstr };
        }
      }
    }
  }

  return normalizedTranslations;
}

module.exports = normalizePlurals;
