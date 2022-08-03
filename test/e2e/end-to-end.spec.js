const path = require( 'path' );
const { readFile } = require( 'fs/promises' );

const { expect } = require( 'chai' );
const gettextParser = require( 'gettext-parser' );

const { translationBuilder, extractors, mergeTranslations, normalizePlurals, compareRefence } = require( '../../src' );

describe( 'end-to-end', () => {
  const headers = {
    'MIME-Version': '1.0',
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Transfer-Encoding': '8bit',
    'Project-Id-Version': 'bc-gettext-utils',
    'Language': 'pl_PL',
    'Plural-Forms': `nplurals=3; plural=(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);`,
  };

  function compile( translations ) {
    return gettextParser.po.compile( { headers, translations }, { sort: compareRefence } ).toString() + '\n';
  }

  it( 'extractors.js', async () => {
    const input = await readFile( path.join( __dirname, 'fixtures/script.js' ), 'utf-8' );
    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/script.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'script.js', extractors.js( input ) );

    const translations = normalizePlurals( builder.translations, 3 );

    const result = compile( translations );

    expect( result ).to.equalLineByLine( expectedOutput );
  } );

  it( 'extractors.vue', async () => {
    const input = await readFile( path.join( __dirname, 'fixtures/component.vue' ), 'utf-8' );
    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/component.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'component.vue', extractors.vue( input ) );

    const translations = normalizePlurals( builder.translations, 3 );

    const result = compile( translations );

    expect( result ).to.equalLineByLine( expectedOutput );
  } );

  it( 'extractors.cs', async () => {
    const input = await readFile( path.join( __dirname, 'fixtures/testclass.cs' ), 'utf-8' );
    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/testclass.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'testclass.cs', extractors.cs( input ) );

    const translations = normalizePlurals( builder.translations, 3 );

    const result = compile( translations );

    expect( result ).to.equalLineByLine( expectedOutput );
  } );

  it( 'extractors.cshtml', async () => {
    const input = await readFile( path.join( __dirname, 'fixtures/view.cshtml' ), 'utf-8' );
    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/view.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'view.cshtml', extractors.cshtml( input ) );

    const translations = normalizePlurals( builder.translations, 3 );

    const result = compile( translations );

    expect( result ).to.equalLineByLine( expectedOutput );
  } );

  it( 'extractors.xaml', async () => {
    const input = await readFile( path.join( __dirname, 'fixtures/window.xaml' ), 'utf-8' );
    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/window.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'window.xaml', extractors.xaml( input ) );

    const translations = normalizePlurals( builder.translations, 3 );

    const result = compile( translations );

    expect( result ).to.equalLineByLine( expectedOutput );
  } );

  it( 'multiple sources', async () => {
    const jsInput = await readFile( path.join( __dirname, 'fixtures/script.js' ), 'utf-8' );
    const vueInput = await readFile( path.join( __dirname, 'fixtures/component.vue' ), 'utf-8' );
    const csInput = await readFile( path.join( __dirname, 'fixtures/testclass.cs' ), 'utf-8' );
    const cshtmlInput = await readFile( path.join( __dirname, 'fixtures/view.cshtml' ), 'utf-8' );
    const xamlInput = await readFile( path.join( __dirname, 'fixtures/window.xaml' ), 'utf-8' );

    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/all.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'script.js', extractors.js( jsInput ) );
    builder.add( 'component.vue', extractors.vue( vueInput ) );
    builder.add( 'testclass.cs', extractors.cs( csInput ) );
    builder.add( 'view.cshtml', extractors.cshtml( cshtmlInput ) );
    builder.add( 'window.xaml', extractors.xaml( xamlInput ) );

    const translations = normalizePlurals( builder.translations, 3 );

    const result = compile( translations );

    expect( result ).to.equalLineByLine( expectedOutput );
  } );

  it( 'merge existing translations', async () => {
    const jsInput = await readFile( path.join( __dirname, 'fixtures/script.js' ), 'utf-8' );
    const vueInput = await readFile( path.join( __dirname, 'fixtures/component.vue' ), 'utf-8' );
    const csInput = await readFile( path.join( __dirname, 'fixtures/testclass.cs' ), 'utf-8' );
    const cshtmlInput = await readFile( path.join( __dirname, 'fixtures/view.cshtml' ), 'utf-8' );
    const xamlInput = await readFile( path.join( __dirname, 'fixtures/window.xaml' ), 'utf-8' );

    const existingInput = await readFile( path.join( __dirname, 'fixtures/all-existing.po' ), 'utf-8' );
    const existing = gettextParser.po.parse( existingInput );

    const expectedOutput = await readFile( path.join( __dirname, 'fixtures/all-merged.po' ), 'utf-8' );

    const builder = translationBuilder();
    builder.add( 'script.js', extractors.js( jsInput ) );
    builder.add( 'component.vue', extractors.vue( vueInput ) );
    builder.add( 'testclass.cs', extractors.cs( csInput ) );
    builder.add( 'view.cshtml', extractors.cshtml( cshtmlInput ) );
    builder.add( 'window.xaml', extractors.xaml( xamlInput ) );

    const { translations, added, updated, deleted } = mergeTranslations( existing.translations, builder.translations );

    expect( added ).to.equal( 1 );
    expect( deleted ).to.equal( 1 );
    expect( updated ).to.equal( 2 );

    const normalizedTranslations = normalizePlurals( translations, 3 );

    const result = gettextParser.po.compile( { headers: existing.headers, translations: normalizedTranslations }, { sort: compareRefence } ).toString() + '\n';

    expect( result ).to.equalLineByLine( expectedOutput );
  } );
} );
