function stubExtractor( translations ) {
  let index = 0;

  function next() {
    if ( index >= translations.length )
      return null;
    return translations[ index++ ];
  }

  return {
    next,
  };
}

module.exports = stubExtractor;
