import { expect } from 'chai';

import { oxcExtractor } from '../../src/oxc-extractor.js';
import { Language } from '../../src/consts.js';

describe( 'oxcExtractor', () => {
  it( '_()', () => {
    const extractor = oxcExtractor( '_( "hello" );', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( '_p()', () => {
    const extractor = oxcExtractor( '_p( "welcome", "hello" );', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.equal( 'welcome' );
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( '_n()', () => {
    const extractor = oxcExtractor( '_n( "a dog", "{0} dogs", n );', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgid_plural ).to.equal( '{0} dogs' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( '_pn()', () => {
    const extractor = oxcExtractor( '_pn( "animal", "a dog", "{0} dogs", n );', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgid_plural ).to.equal( '{0} dogs' );
    expect( result.msgctxt ).to.equal( 'animal' );
    expect( result.line ).to.equal( 1 );
  } );

  it( 'escape sequences', () => {
    const extractor = oxcExtractor( '_( "hello\\r\\n\\"world\\"" );', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello\r\n"world"' );
  } );

  it( 'concatenation', () => {
    const extractor = oxcExtractor( '_( "hello, "\n + "world"\n + "!" );', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello, world!' );
  } );

  it( 'inside a function', () => {
    const extractor = oxcExtractor( 'function test( a ) { if ( a > 0 ) return _( "hello" ); }', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
  } );

  it( 'inside a TypeScript function', () => {
    const extractor = oxcExtractor( 'function test( a: number ): string | undefined { if ( a > 0 ) return _( "hello" ); }', Language.TypeScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
  } );

  it( 'inside JSX expression', () => {
    const extractor = oxcExtractor( '<button>{_( "OK" )}</button>', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'OK' );
  } );

  it( 'inside JSX attribute', () => {
    const extractor = oxcExtractor( '<button onclick={() => alert( _( "hello" ) )}>OK</button>', Language.JavaScript );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
  } );

  it( 'multiple strings', () => {
    const extractor = oxcExtractor( 'function test( a ) {\nif ( a > 0 )\nreturn _( "hello" );\nreturn _( "world" );\n}', Language.JavaScript );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.line ).to.equal( 3 );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.line ).to.equal( 4 );

    const t3 = extractor.next();

    expect( t3 ).to.be.null;
  } );


  it( 'with custom options', () => {
    const extractor = oxcExtractor( 'Text( "hello" );\nPlural( "world", "worlds" );\nContext( "ctx", "test" );PluralContext( "ctx2", "a dog", "{0} dogs" )', Language.JavaScript, {
      string: 'Text',
      particularString: 'Context',
      pluralString: 'Plural',
      particularPluralString: 'PluralContext',
    } );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.msgid_plural ).to.equal( 'worlds' );

    const t3 = extractor.next();

    expect( t3.msgid ).to.equal( 'test' );
    expect( t3.msgctxt ).to.equal( 'ctx' );

    const t4 = extractor.next();

    expect( t4.msgid ).to.equal( 'a dog' );
    expect( t4.msgid_plural ).to.equal( '{0} dogs' );
    expect( t4.msgctxt ).to.equal( 'ctx2' );

    const t5 = extractor.next();

    expect( t5 ).to.be.null;
  } );

  it( 'with multiple function names', () => {
    const extractor = oxcExtractor( '__( "hello" ); _e( "world" );', Language.JavaScript, {
      string: [ '__', '_e' ],
    } );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
  } );

  it( 'with reversed context argument', () => {
    const extractor = oxcExtractor( '_x( "hello", "ctx" ); _nx( "a dog", "%d dogs", n, "ctx2" );', Language.JavaScript, {
      particularString: '_x',
      particularPluralString: '_nx',
      reverseContext: true,
    } );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.msgctxt ).to.equal( 'ctx' );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'a dog' );
    expect( t2.msgid_plural ).to.equal( '%d dogs' );
    expect( t2.msgctxt ).to.equal( 'ctx2' );
  } );
} );
