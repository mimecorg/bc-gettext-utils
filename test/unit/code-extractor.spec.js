const { expect } = require( 'chai' );

const codeExtractor = require( '../../src/code-extractor' );
const codeLexer = require( '../../src/code-lexer' );
const { Language } = require( '../../src/consts' );
const razorLexer = require( '../../src/razor-lexer' );
const vueCodeLexer = require('../../src/vue-code-lexer');
const vueLexer = require('../../src/vue-lexer');

describe( 'codeExtractor', () => {
  it( '_()', () => {
    const lexer = codeLexer( '_( "hello" );', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( '_p()', () => {
    const lexer = codeLexer( '_p( "welcome", "hello" );', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.equal( 'welcome' );
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( '_n()', () => {
    const lexer = codeLexer( '_n( "a dog", "{0} dogs", n );', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgid_plural ).to.equal( '{0} dogs' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( '_pn()', () => {
    const lexer = codeLexer( '_pn( "animal", "a dog", "{0} dogs", n );', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgid_plural ).to.equal( '{0} dogs' );
    expect( result.msgctxt ).to.equal( 'animal' );
    expect( result.line ).to.equal( 1 );
  } );

  it( 'escape sequences', () => {
    const lexer = codeLexer( '_( "hello\\r\\n\\"world\\"" );', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello\r\n"world"' );
  } );

  it( 'concatenation', () => {
    const lexer = codeLexer( '_( "hello, "\n + "world"\n + "!" );', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello, world!' );
  } );

  it( 'C# verbatim string', () => {
    const lexer = codeLexer( '_( @"hello,\nworld!" );', Language.CSharp );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello,\nworld!' );
  } );

  it( 'C# display attribute', () => {
    const lexer = codeLexer( '[Display( Name = "Display Name", ShortName = "Name" )]', Language.CSharp );
    const extractor = codeExtractor( lexer, { extractAttributes: true } );

    const result = extractor.next();

    expect( result ).to.be.an( 'array' ).of.length( 2 );

    expect( result[ 0 ].msgid ).to.equal( 'Display Name' );
    expect( result[ 1 ].msgid ).to.equal( 'Name' );
  } );

  it( 'C# error message in attribute', () => {
    const lexer = codeLexer( '[StringLength( 100, ErrorMessage = "Too long" )]', Language.CSharp );
    const extractor = codeExtractor( lexer, { extractAttributes: true } );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'Too long' );
  } );

  it( 'C# parentheses in attribute', () => {
    const lexer = codeLexer( '[Compare( nameof( Other ), ErrorMessage = "Must equal" )]', Language.CSharp );
    const extractor = codeExtractor( lexer, { extractAttributes: true } );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'Must equal' );
  } );

  it( 'inside a function', () => {
    const lexer = codeLexer( 'function test( a ) { if ( a > 0 ) return _( "hello" ); }', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
  } );

  it( 'multiple strings', () => {
    const lexer = codeLexer( 'function test( a ) {\nif ( a > 0 )\nreturn _( "hello" );\nreturn _( "world" );\n}', Language.JavaScript );
    const extractor = codeExtractor( lexer );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.line ).to.equal( 3 );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.line ).to.equal( 4 );

    const t3 = extractor.next();

    expect( t3 ).to.be.null;
  } );

  it( 'with razorLexer', () => {
    const lexer = razorLexer( '_( "HTML" );\n@{\n_( "hello" );\n<p>@_( "world" )</p>\n}\n_( "more HTML" );', codeLexer );
    const extractor = codeExtractor( lexer, { insideCode: false } );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.line ).to.equal( 3 );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.line ).to.equal( 4 );

    const t3 = extractor.next();

    expect( t3 ).to.be.null;
  } );

  it( 'with vueCodeLexer', () => {
    const lexer = vueCodeLexer( '<template>\n<p>_( "HTML" );</p>\n<p>{{ _( "hello" ); }}</p>\n</template>\n<script>\n_( "world" );\n</script>', vueLexer, codeLexer );
    const extractor = codeExtractor( lexer, { insideCode: false } );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.line ).to.equal( 3 );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.line ).to.equal( 6 );

    const t3 = extractor.next();

    expect( t3 ).to.be.null;
  } );

  it( 'with custom options', () => {
    const lexer = codeLexer( 'Text( "hello" );\nPlural( "world", "worlds" );\nContext( "ctx", "test" );PluralContext( "ctx2", "a dog", "{0} dogs" )', Language.JavaScript );

    const extractor = codeExtractor( lexer, {}, {
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
} );
