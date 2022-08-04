const { expect } = require( 'chai' );

const translationBuilder = require( '../../src/translation-builder' );

const stubExtractor = require( '../helpers/stub-extractor' );

describe( 'translationBuilder', () => {
  it( 'add simple message', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'hello' } ] ) );

    expect( builder.count ).to.equal( 1 );

    expect( builder.translations ).to.be.an( 'object' );
    expect( builder.translations[ '' ] ).to.be.an( 'object' );

    const msg = builder.translations[ '' ][ 'hello' ];
    expect( msg ).to.be.an( 'object' );
    expect( msg.msgid ).to.equal( 'hello' );
    expect( msg.msgid_plural ).to.be.undefined;
    expect( msg.msgctxt ).to.be.undefined;
    expect( msg.msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( '' );
    expect( msg.comments ).to.be.an( 'object' );
    expect( msg.comments.reference ).to.equal( 'file1.js:12' );
  } );

  it( 'add message with context', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'hello', msgctxt: 'welcome' } ] ) );

    expect( builder.count ).to.equal( 1 );

    expect( builder.translations ).to.be.an( 'object' );
    expect( builder.translations[ 'welcome' ] ).to.be.an( 'object' );

    const msg = builder.translations[ 'welcome' ][ 'hello' ];
    expect( msg ).to.be.an( 'object' );
    expect( msg.msgid ).to.equal( 'hello' );
    expect( msg.msgid_plural ).to.be.undefined;
    expect( msg.msgctxt ).to.equal( 'welcome' );
    expect( msg.msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( '' );
    expect( msg.comments ).to.be.an( 'object' );
    expect( msg.comments.reference ).to.equal( 'file1.js:12' );
  } );

  it( 'add plural message', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'a dog', msgid_plural: '{0} dogs' } ] ) );

    expect( builder.count ).to.equal( 1 );

    expect( builder.translations ).to.be.an( 'object' );
    expect( builder.translations[ '' ] ).to.be.an( 'object' );

    const msg = builder.translations[ '' ][ 'a dog' ];
    expect( msg ).to.be.an( 'object' );
    expect( msg.msgid ).to.equal( 'a dog' );
    expect( msg.msgid_plural ).to.equal( '{0} dogs' );
    expect( msg.msgctxt ).to.be.undefined;
    expect( msg.msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( '' );
    expect( msg.comments ).to.be.an( 'object' );
    expect( msg.comments.reference ).to.equal( 'file1.js:12' );
  } );

  it( 'add the same message twice', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'hello' } ] ) );
    builder.add( 'file2.cs', stubExtractor( [ { line: 34, msgid: 'hello' } ] ) );

    expect( builder.count ).to.equal( 1 );

    const msg = builder.translations[ '' ][ 'hello' ];
    expect( msg ).to.be.an( 'object' );
    expect( msg.msgid ).to.equal( 'hello' );
    expect( msg.msgid_plural ).to.be.undefined;
    expect( msg.msgctxt ).to.be.undefined;
    expect( msg.msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( '' );
    expect( msg.comments ).to.be.an( 'object' );
    expect( msg.comments.reference ).to.equal( 'file1.js:12 file2.cs:34' );
  } );

  it( 'add simple and plural message', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'a dog' }, { line: 12, msgid: 'a dog', msgid_plural: '{0} dogs' } ] ) );

    expect( builder.count ).to.equal( 1 );

    const msg = builder.translations[ '' ][ 'a dog' ];
    expect( msg ).to.be.an( 'object' );
    expect( msg.msgid ).to.equal( 'a dog' );
    expect( msg.msgid_plural ).to.be.equal( '{0} dogs' );
    expect( msg.msgctxt ).to.be.undefined;
    expect( msg.msgstr ).to.be.an( 'array' ).of.length( 1 ).which.contains( '' );
    expect( msg.comments ).to.be.an( 'object' );
    expect( msg.comments.reference ).to.equal( 'file1.js:12' );
  } );

  it( 'add different messages', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'a dog' }, { line: 34, msgid: 'a cat' } ] ) );

    expect( builder.count ).to.equal( 2 );

    const msg1 = builder.translations[ '' ][ 'a dog' ];
    expect( msg1.msgid ).to.equal( 'a dog' );
    expect( msg1.comments.reference ).to.equal( 'file1.js:12' );

    const msg2 = builder.translations[ '' ][ 'a cat' ];
    expect( msg2.msgid ).to.equal( 'a cat' );
    expect( msg2.comments.reference ).to.equal( 'file1.js:34' );
  } );

  it( 'add messages with different contexts', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: 'table', msgctxt: 'database' }, { line: 34, msgid: 'table', msgctxt: 'kitchen' } ] ) );

    expect( builder.count ).to.equal( 2 );

    const msg1 = builder.translations[ 'database' ][ 'table' ];
    expect( msg1.msgid ).to.equal( 'table' );
    expect( msg1.comments.reference ).to.equal( 'file1.js:12' );

    const msg2 = builder.translations[ 'kitchen' ][ 'table' ];
    expect( msg2.msgid ).to.equal( 'table' );
    expect( msg2.comments.reference ).to.equal( 'file1.js:34' );
  } );

  it( 'ignore empty messages', () => {
    const builder = translationBuilder();

    builder.add( 'file1.js', stubExtractor( [ { line: 12, msgid: '', msgctxt: '' }, { line: 34, msgid: '', msgctxt: 'context' } ] ) );

    expect( builder.count ).to.equal( 0 );
  } );
} );
