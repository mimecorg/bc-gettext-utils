function translationBuilder() {
  const translations = {};

  let count = 0;

  function add( file, extractor ) {
    while ( true ) {
      const translation = extractor.next();

      if ( translation == null )
        break;

      if ( Array.isArray( translation ) ) {
        for ( const item of translation ) {
          const { line, msgctxt = '', msgid, msgid_plural = null } = item;

          if ( msgid != '' )
            addTranslation( file, line, msgctxt, msgid, msgid_plural );
        }
      } else {
        const { line, msgctxt = '', msgid, msgid_plural = null } = translation;

        if ( msgid != '' )
          addTranslation( file, line, msgctxt, msgid, msgid_plural );
      }
    }
  }

  function addTranslation( file, line, msgctxt, msgid, msgid_plural ) {
    if ( translations[ msgctxt ] == null )
      translations[ msgctxt ] = {};

    if ( translations[ msgctxt ][ msgid ] == null ) {
      const message = {
        msgid: msgid,
        msgstr: [ '' ],
        comments: {
          reference: `${file}:${line}`,
        },
      };

      if ( msgctxt != '' )
        message.msgctxt = msgctxt;

      if ( msgid_plural != null )
        message.msgid_plural = msgid_plural;

      translations[ msgctxt ][ msgid ] = message;

      count++;
    } else {
      const msg = translations[ msgctxt ][ msgid ];

      if ( msgid_plural != null && msg.msgid_plural == null )
        msg.msgid_plural = msgid_plural;

      if ( !msg.comments.reference.split( ' ' ).includes( `${file}:${line}` ) )
        msg.comments.reference += ` ${file}:${line}`;
    }
  }

  return {
    add,
    get translations() { return translations; },
    get count() { return count; },
  };
}

module.exports = translationBuilder;
