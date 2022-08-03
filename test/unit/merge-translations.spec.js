const { expect } = require( 'chai' );

const mergeTranslations = require( '../../src/merge-translations' );

describe( 'mergeTranslations', () => {
  it( 'add', () => {
    const { translations, added, updated, deleted } = mergeTranslations( {}, { '': { 'new': { msgid: 'new', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } } );

    expect( added ).to.equal( 1 );
    expect( updated ).to.equal( 0 );
    expect( deleted ).to.equal( 0 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'new' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'new' ].msgid ).to.equal( 'new' );
    expect( translations[ '' ][ 'new' ].msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( '' );
    expect( translations[ '' ][ 'new' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'remove', () => {
    const { translations, added, updated, deleted } = mergeTranslations( { '': { 'old': { msgid: 'old', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } }, {} );

    expect( added ).to.equal( 0 );
    expect( updated ).to.equal( 0 );
    expect( deleted ).to.equal( 1 );

    expect( translations[ '' ] ).to.be.undefined;
  } );

  it( 'no changes', () => {
    const existingTranslations = { '': { 'hello': { msgid: 'hello', msgstr: [ 'cześć' ], comments: { reference: 'file1.js:123' } } } };
    const newTranslations = { '': { 'hello': { msgid: 'hello', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } };

    const { translations, added, updated, deleted } = mergeTranslations( existingTranslations, newTranslations );

    expect( added ).to.equal( 0 );
    expect( updated ).to.equal( 0 );
    expect( deleted ).to.equal( 0 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'hello' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'hello' ].msgid ).to.equal( 'hello' );
    expect( translations[ '' ][ 'hello' ].msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( 'cześć' );
    expect( translations[ '' ][ 'hello' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'update reference', () => {
    const existingTranslations = { '': { 'hello': { msgid: 'hello', msgstr: [ 'cześć' ], comments: { reference: 'file1.js:123' } } } };
    const newTranslations = { '': { 'hello': { msgid: 'hello', msgstr: [ '' ], comments: { reference: 'file1.js:456' } } } };

    const { translations, added, updated, deleted } = mergeTranslations( existingTranslations, newTranslations );

    expect( added ).to.equal( 0 );
    expect( updated ).to.equal( 1 );
    expect( deleted ).to.equal( 0 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'hello' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'hello' ].msgid ).to.equal( 'hello' );
    expect( translations[ '' ][ 'hello' ].msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( 'cześć' );
    expect( translations[ '' ][ 'hello' ].comments.reference ).to.equal( 'file1.js:456' );
  } );

  it( 'change singular to plural', () => {
    const existingTranslations = { '': { 'world': { msgid: 'world', msgstr: [ 'świat' ], comments: { reference: 'file1.js:123' } } } };
    const newTranslations = { '': { 'world': { msgid: 'world', msgid_plural: 'worlds', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } };

    const { translations, added, updated, deleted } = mergeTranslations( existingTranslations, newTranslations );

    expect( added ).to.equal( 0 );
    expect( updated ).to.equal( 1 );
    expect( deleted ).to.equal( 0 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( translations[ '' ][ 'world' ].msgid_plural ).to.equal( 'worlds' );
    expect( translations[ '' ][ 'world' ].msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( 'świat' );
    expect( translations[ '' ][ 'world' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'change singular to plural', () => {
    const existingTranslations = { '': { 'world': { msgid: 'world', msgid_plural: 'worlds', msgstr: [ 'świat', 'światy' ], comments: { reference: 'file1.js:123' } } } };
    const newTranslations = { '': { 'world': { msgid: 'world', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } };

    const { translations, added, updated, deleted } = mergeTranslations( existingTranslations, newTranslations );

    expect( added ).to.equal( 0 );
    expect( updated ).to.equal( 1 );
    expect( deleted ).to.equal( 0 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( translations[ '' ][ 'world' ].msgid_plural ).to.be.undefined;
    expect( translations[ '' ][ 'world' ].msgstr ).to.be.an( 'array' ).of.length( 2 ).which.contains( 'świat' ).and.contains( 'światy' );
    expect( translations[ '' ][ 'world' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'preserve comments', () => {
    const existingTranslations = { '': { 'world': { msgid: 'world', msgstr: [ 'świat' ], comments: { translator: 'to check', flag: 'fuzzy', reference: 'file1.js:123' } } } };

    const newTranslations = { '': { 'world': { msgid: 'world', msgstr: [ '' ], comments: { reference: 'file1.js:123' } } } };

    const { translations, added, updated, deleted } = mergeTranslations( existingTranslations, newTranslations );

    expect( added ).to.equal( 0 );
    expect( updated ).to.equal( 0 );
    expect( deleted ).to.equal( 0 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( translations[ '' ][ 'world' ].comments.translator ).to.equal( 'to check' );
    expect( translations[ '' ][ 'world' ].comments.flag ).to.equal( 'fuzzy' );
    expect( translations[ '' ][ 'world' ].comments.reference ).to.equal( 'file1.js:123' );
  } );

  it( 'multiple changes', () => {
    const existingTranslations = { '': { 'world': { msgid: 'world', msgstr: [ 'świat' ], comments: { reference: 'file1.js:123' } },
      'to delete': { msgid: 'to delete', msgstr: [ 'do usunięcia' ], comments: { reference: 'file2.js:123' } } } };

    const newTranslations = { '': { 'world': { msgid: 'world', msgstr: [ '' ], comments: { reference: 'file1.js:456' } } },
      'context': { 'to add': { msgid: 'to add', msgctxt: 'context', msgstr: [ '' ], comments: { reference: 'file2.js:123' } } } };

    const { translations, added, updated, deleted } = mergeTranslations( existingTranslations, newTranslations );

    expect( added ).to.equal( 1 );
    expect( updated ).to.equal( 1 );
    expect( deleted ).to.equal( 1 );

    expect( translations[ '' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ] ).to.be.an( 'object' );
    expect( translations[ '' ][ 'world' ].msgid ).to.equal( 'world' );
    expect( translations[ '' ][ 'to delete' ] ).to.be.undefined;
    expect( translations[ 'context' ] ).to.be.an( 'object' );
    expect( translations[ 'context' ][ 'to add' ] ).to.be.an( 'object' );
    expect( translations[ 'context' ][ 'to add' ].msgid ).to.equal( 'to add' );
  } );
} );
