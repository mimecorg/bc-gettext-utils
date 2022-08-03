const referenceRegExp = /(.*?):(\d+)/;

function compareReference( left, right ) {
  const matchLeft = referenceRegExp.exec( left.comments.reference );
  const matchRight = referenceRegExp.exec( right.comments.reference );

  if ( matchLeft[ 1 ] < matchRight[ 1 ] )
    return -1;

  if ( matchLeft[ 1 ] > matchRight[ 1 ] )
    return 1;

  const lineLeft = Number( matchLeft[ 2 ] );
  const lineRight = Number( matchRight[ 2 ] );

  if ( lineLeft < lineRight )
    return -1;

  if ( lineLeft > lineRight )
    return 1;

  if ( left.msgid < right.msgid )
    return -1;

  if ( left.msgid > right.msgid )
    return -1;

  return 0;
}

module.exports = compareReference;
