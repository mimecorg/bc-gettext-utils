const { expect } = require( 'chai' );

const compareRefence = require( '../../src/compare-reference' );

describe( 'compareReference', () => {
  it( 'by path', () => {
    const result1 = compareRefence( { comments: { reference: '../src/a.js:32' } }, { comments: { reference: '../src/b.js:15' } } );
    expect( result1 ).to.be.lessThan( 0 );

    const result2 = compareRefence( { comments: { reference: '../src/zzz.js:32' } }, { comments: { reference: '../src/zza.js:15' } } );
    expect( result2 ).to.be.greaterThan( 0 );
  } );

  it( 'by line number', () => {
    const result1 = compareRefence( { comments: { reference: '../src/a.js:32' } }, { comments: { reference: '../src/a.js:150' } } );
    expect( result1 ).to.be.lessThan( 0 );

    const result2 = compareRefence( { comments: { reference: '../src/zzz.js:32' } }, { comments: { reference: '../src/zzz.js:3' } } );
    expect( result2 ).to.be.greaterThan( 0 );
  } );

  it( 'by message', () => {
    const result1 = compareRefence( { msgid: 'alpha', comments: { reference: '../src/a.js:32' } }, { msgid: 'beta', comments: { reference: '../src/a.js:32' } } );
    expect( result1 ).to.be.lessThan( 0 );

    const result2 = compareRefence( { msgid: 'beta', comments: { reference: '../src/a.js:32' } }, { msgid: 'alpha', comments: { reference: '../src/a.js:32' } } );
    expect( result2 ).to.be.greaterThan( 0 );
  } );
} );
