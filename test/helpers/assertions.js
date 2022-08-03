function equalLineByLine( chai, utils ) {
  utils.addMethod( chai.Assertion.prototype, 'equalLineByLine', function ( value ) {
    new chai.Assertion( this._obj ).to.be.a( 'string' );

    const expected = value.split( '\n' );
    const actual = this._obj.split( '\n' );

    const length = Math.max( expected.length, actual.length );

    for ( let i = 0; i < length; i++ )
      new chai.Assertion( expected[ i ], `Unexpected content in line ${i+1}` ).to.equal( actual[ i ] );
  } );
}

module.exports = {
  equalLineByLine,
};
