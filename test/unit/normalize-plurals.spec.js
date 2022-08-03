const { expect } = require( 'chai' );

const normalizePlurals = require( '../../src/normalize-plurals' );

describe( 'normalizePlurals', () => {
  it( 'singular to plural', () => {
    const translations = { '': { 'world': { msgid: 'world', msgid_plural: 'worlds', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } };

    const normalizedTranslations = normalizePlurals( translations, 2 );

    expect( normalizedTranslations[ '' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr ).to.be.an( 'array' ).of.length( 2 );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr[ 0 ] ).to.equal( '' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr[ 1 ] ).to.equal( '' );
    expect( normalizedTranslations[ '' ][ 'world' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'plural to singular', () => {
    const translations = { '': { 'world': { msgid: 'world', msgstr: [ '', '' ], comments: { reference: 'file1.js:123' } } } };

    const normalizedTranslations = normalizePlurals( translations, 2 );

    expect( normalizedTranslations[ '' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr ).to.be.an( 'array' ).of.length( 1 );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr[ 0 ] ).to.equal( '' );
    expect( normalizedTranslations[ '' ][ 'world' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'add/remove translations', () => {
    const translations = { '': { 'world': { msgid: 'world', msgid_plural: 'worlds', msgstr: [ 'świat' ], comments: { reference: 'file1.js:123' } },
      'a dog': { msgid: 'a dog', msgid_plural: '{0} dogs', msgstr: [ 'pies', '{0} psy', '{0} psów' ], comments: { reference: 'file1.js:456' } } } };

    const normalizedTranslations = normalizePlurals( translations, 2 );

    expect( normalizedTranslations[ '' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr ).to.be.an( 'array' ).of.length( 2 );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr[ 0 ] ).to.equal( 'świat' );
    expect( normalizedTranslations[ '' ][ 'world' ].msgstr[ 1 ] ).to.equal( '' );
    expect( normalizedTranslations[ '' ][ 'world' ].comments.reference ).to.equal( 'file1.js:123' );

    expect( normalizedTranslations[ '' ][ 'a dog' ] ).to.be.an( 'object' );
    expect( normalizedTranslations[ '' ][ 'a dog' ].msgid ).to.equal( 'a dog' );
    expect( normalizedTranslations[ '' ][ 'a dog' ].msgstr ).to.be.an( 'array' ).of.length( 2 );
    expect( normalizedTranslations[ '' ][ 'a dog' ].msgstr[ 0 ] ).to.equal( 'pies' );
    expect( normalizedTranslations[ '' ][ 'a dog' ].msgstr[ 1 ] ).to.equal( '{0} psy' );
    expect( normalizedTranslations[ '' ][ 'a dog' ].comments.reference ).to.equal( 'file1.js:456' );
  } );
} );
