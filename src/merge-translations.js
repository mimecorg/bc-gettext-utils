function mergeTranslations( existingTranslations, newTranslations ) {
  const translations = {};

  let added = 0;
  let updated = 0;
  let deleted = 0;

  for ( const context in newTranslations ) {
    translations[ context ] = {};

    for ( const msgid in newTranslations[ context ] ) {
      const message = newTranslations[ context ][ msgid ];

      if ( existingTranslations[ context ] != null && existingTranslations[ context ][ msgid ] != null ) {
        const existingMessage = existingTranslations[ context ][ msgid ];

        const { translator, reference, flag } = existingMessage.comments;

        if ( message.comments.reference != reference || message.msgid_plural != existingMessage.msgid_plural )
          updated++;

        translations[ context ][ msgid ] = {
          ...message,
          msgstr: existingMessage.msgstr,
        };

        if ( translator != null )
          translations[ context ][ msgid ].comments.translator = translator;
        if ( flag != null )
          translations[ context ][ msgid ].comments.flag = flag;
      } else {
        translations[ context ][ msgid ] = message;
        added++;
      }
    }
  }

  for ( const context in existingTranslations ) {
    for ( const msgid in existingTranslations[ context ] ) {
      if ( ( context != '' || msgid != '' ) && ( newTranslations[ context ] == null || newTranslations[ context ][ msgid ] == null ) )
        deleted++;
    }
  }

  return { translations, added, updated, deleted };
}

module.exports = mergeTranslations;
