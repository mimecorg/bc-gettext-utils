const expect = require( 'chai' ).expect;

const xamlExtractor = require( '../../src/xaml-extractor' );
const xamlLexer = require( '../../src/xaml-lexer' );

describe( 'xamlExtractor', () => {
  it( 'simple extension', () => {
    const lexer = xamlLexer( '<Label Content="{i18n:Translate hello}"/>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( 'extension with named args', () => {
    const lexer = xamlLexer( '<Label Content="{i18n:Translate Text=a dog, PluralText=some dogs}"/>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgid_plural ).to.equal( 'some dogs' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( 'extension with mixed args', () => {
    const lexer = xamlLexer( '<Label Content="{i18n:Translate hello, Context=welcome}"/>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.msgctxt ).to.be.equal( 'welcome' );
    expect( result.line ).to.equal( 1 );
  } );

  it( 'extension with quoted args', () => {
    const lexer = xamlLexer( '<Label Content="{Binding Path=Count, Converter={i18n:Format \'a dog\', PluralText=\'{0} dogs\', Context=\'animal\'}}"/>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgid_plural ).to.equal( '{0} dogs' );
    expect( result.msgctxt ).to.be.equal( 'animal' );
    expect( result.line ).to.equal( 1 );
  } );

  it( 'tag with attributes', () => {
    const lexer = xamlLexer( '<i18n:Translate Text="hello"/>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( 'tag with content', () => {
    const lexer = xamlLexer( '<i18n:Translate>hello</i18n:Translate>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( 'tag with content and attributes', () => {
    const lexer = xamlLexer( '<i18n:Translate Context="welcome">hello</i18n:Translate>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'hello' );
    expect( result.msgctxt ).to.equal( 'welcome' );
    expect( result.msgid_plural ).to.be.undefined;
    expect( result.line ).to.equal( 1 );
  } );

  it( 'tag with child tags', () => {
    const lexer = xamlLexer( '<i18n:Translate>\n<i18n:Translate.Text>a dog</i18n:Translate.Text>\n<i18n:Translate.PluralText>some dogs</i18n:Translate.PluralText>\n</i18n:Translate>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.equal( 'some dogs' );
    expect( result.line ).to.equal( 1 );
  } );

  it( 'tag with content and child tags', () => {
    const lexer = xamlLexer( '<i18n:Translate>a dog\n<i18n:Translate.PluralText>some dogs</i18n:Translate.PluralText>\n</i18n:Translate>' );
    const extractor = xamlExtractor( lexer );

    const result = extractor.next();

    expect( result.msgid ).to.equal( 'a dog' );
    expect( result.msgctxt ).to.be.undefined;
    expect( result.msgid_plural ).to.equal( 'some dogs' );
    expect( result.line ).to.equal( 1 );
  } );

  it( 'multiple strings', () => {
    const lexer = xamlLexer( '<Label Content="{i18n:Translate hello}"/>\n<Label>\n<i18n:Translate>world</i18n:Translate>\n</Label>' );
    const extractor = xamlExtractor( lexer );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.line ).to.equal( 1 );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.line ).to.equal( 3 );

    const t3 = extractor.next();

    expect( t3 ).to.be.null;
  } );

  it( 'with custom options', () => {
    const lexer = xamlLexer( '<Label Content="{local:Tr Tx=hello}"/>\n<Label>\n<local:Tr Ctx="context">\nworld\n<local:Tr.Pl>worlds</local:Tr.Pl>\n</local:Tr>' );
    const extractor = xamlExtractor( lexer, {
      extensions: [ 'local:Tr' ],
      textAttribute: 'Tx',
      pluralTextAttribute: 'Pl',
      contextAttribute: 'Ctx',
    } );

    const t1 = extractor.next();

    expect( t1.msgid ).to.equal( 'hello' );
    expect( t1.line ).to.equal( 1 );

    const t2 = extractor.next();

    expect( t2.msgid ).to.equal( 'world' );
    expect( t2.msgctxt ).to.equal( 'context' );
    expect( t2.msgid_plural ).to.equal( 'worlds' );
    expect( t2.line ).to.equal( 3 );

    const t3 = extractor.next();

    expect( t3 ).to.be.null;
  } );
} );
