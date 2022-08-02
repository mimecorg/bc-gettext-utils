const { expect } = require( 'chai' );

const xamlLexer = require( '../../src/xaml-lexer' );
const { Token } = require( '../../src/consts' );

describe( 'xamlLexer', () => {
  describe( 'tags', () => {
    const data = [
      { title: 'opening tag', text: '<Label Content="hello">', token: Token.TagStart, value: '<Label' },
      { title: 'closing tag', text: '</Label>', token: Token.TagStart, value: '</Label' },
      { title: 'namespaced tag', text: '<i18n:Translate Text="hello" />', token: Token.TagStart, value: '<i18n:Translate' },
      { title: 'tag with dot', text: '<Label.Content>', token: Token.TagStart, value: '<Label.Content' },
      { title: 'namespaced tag with dot', text: '<i18n:Translate.Text>', token: Token.TagStart, value: '<i18n:Translate.Text' },
    ];

    for ( const { title, text, token, value } of data ) {
      it( title, () => {
        const lexer = xamlLexer( text );

        const result = lexer.next();

        expect( result ).to.be.an( 'object' );
        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( 1 );
      } );
    }
  } );

  describe( 'text before token', () => {
    const data = [
      { title: 'opening tag', text: 'this is a <Label Content="label">', value: 'this is a ' },
      { title: 'closing tag', text: 'foobar\n</Label.Text>', value: 'foobar\n' },
      { title: 'comment', text: 'foo:<!-- comment -->', value: 'foo:' },
    ];

    for ( const { title, text, value } of data ) {
      it( title, () => {
        const lexer = xamlLexer( text );

        const result = lexer.next();

        expect( result ).to.be.an( 'object' );
        expect( result.token ).to.equal( Token.Text );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( 1 );
      } );
    }
  } );

  describe( 'skip comments', () => {
    const data = [
      { title: 'opening tag', text: '<!-- comment --><Label Content="label">', value: '<Label' },
      { title: 'closing tag', text: '<!-- this\nis\na comment --></Label.Text>', value: '</Label.Text', line: 3 },
    ];

    for ( const { title, text, value, line = 1 } of data ) {
      it( title, () => {
        const lexer = xamlLexer( text );

        const result = lexer.next();

        expect( result.token ).to.equal( Token.TagStart );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( line );
      } );
    }
  } );

  describe( 'tag tokens', () => {
    const data = [
      { title: 'simple identifier', text: '<Label Content="#">', token: Token.Identifier, value: 'Content' },
      { title: 'single string', text: '<Label "foo">', token: Token.String, value: 'foo' },
      { title: 'double string', text: "<Label 'bar'>", token: Token.String, value: 'bar' },
      { title: 'double string with LF', text: '<Label "foo\nbar">', token: Token.String, value: 'foo\nbar' },
      { title: 'operator', text: "<Label = >", token: Token.Operator, value: '=' },
      { title: 'tag end', text: "<Label>", token: Token.TagEnd, value: '>' },
      { title: 'self-close tag end', text: "<Label/>", token: Token.TagEnd, value: '/>' },
    ];

    for ( const { title, text, token, value } of data ) {
      it( title, () => {
        const lexer = xamlLexer( text );
        lexer.next();

        const result = lexer.next();

        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
      } );
    }
  } );

  describe( 'simple extensions', () => {
    // <Label Content="{Binding}" />
    // <Label Content="{Binding Name}" />
    // <Label Content="{Binding Path=Name}" />
    // <Label Content="{i18n:Translate Hello, world!}" />
    // <Label Content="{i18n:Translate 'Hello, world!'}" />

    it( 'without parameters', () => {
      const lexer = xamlLexer( '<Label Content="{Binding}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'Binding' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.ExtensionEnd );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.TagEnd );
    } );

    it( 'with simple parameter', () => {
      const lexer = xamlLexer( '<Label Content="{Binding Name}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'Binding' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'Name' );
      expect( t2.delimiter ).to.equal( '' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.ExtensionEnd );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagEnd );
    } );

    it( 'with unquoted parameter', () => {
      const lexer = xamlLexer( '<Label Content="{i18n:Translate This is a test}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'i18n:Translate' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'This is a test' );
      expect( t2.delimiter ).to.equal( '' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.ExtensionEnd );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagEnd );
    } );

    it( 'with quoted parameter', () => {
      const lexer = xamlLexer( '<Label Content="{i18n:Translate \'Hello, world!\'}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'i18n:Translate' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'Hello, world!' );
      expect( t2.delimiter ).to.equal( "'" );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.ExtensionEnd );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagEnd );
    } );

    it( 'with named parameter', () => {
      const lexer = xamlLexer( '<Label Content="{Binding Path=Name}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'Binding' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Identifier );
      expect( t2.value ).to.equal( 'Path' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( '=' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.String );
      expect( t5.value ).to.equal( 'Name' );
      expect( t5.delimiter ).to.equal( '' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.ExtensionEnd );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.TagEnd );
    } );
  } );

  describe( 'complex extensions', () => {
    it( 'with unquoted parameters', () => {
      const lexer = xamlLexer( '<Label Content="{i18n:Translate Hello, Context=welcome}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'i18n:Translate' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'Hello' );
      expect( t2.delimiter ).to.equal( '' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( ',' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Identifier );
      expect( t5.value ).to.equal( 'Context' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Operator );
      expect( t6.value ).to.equal( '=' );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.String );
      expect( t7.value ).to.equal( 'welcome' );
      expect( t7.delimiter ).to.equal( '' );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.ExtensionEnd );

      const t9 = lexer.next();
      expect( t9.token ).to.equal( Token.TagEnd );
    } );

    it( 'with quoted parameters', () => {
      const lexer = xamlLexer( '<Label Content="{i18n:Translate \'Hello, world!\', Context=\'welcome\'}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'i18n:Translate' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'Hello, world!' );
      expect( t2.delimiter ).to.equal( "'" );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( ',' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Identifier );
      expect( t5.value ).to.equal( 'Context' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Operator );
      expect( t6.value ).to.equal( '=' );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.String );
      expect( t7.value ).to.equal( 'welcome' );
      expect( t7.delimiter ).to.equal( "'" );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.ExtensionEnd );

      const t9 = lexer.next();
      expect( t9.token ).to.equal( Token.TagEnd );
    } );

    it( 'with nested extension', () => {
      const lexer = xamlLexer( '<Label Content="{Binding Name, Converter={i18n:Format \'Hello, {0}!\'}}" />' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'Binding' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'Name' );
      expect( t2.delimiter ).to.equal( '' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( ',' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Identifier );
      expect( t5.value ).to.equal( 'Converter' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Operator );
      expect( t6.value ).to.equal( '=' );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.ExtensionStart );
      expect( t7.value ).to.equal( 'i18n:Format' );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.String );
      expect( t8.value ).to.equal( 'Hello, {0}!' );
      expect( t8.delimiter ).to.equal( "'" );

      const t9 = lexer.next();
      expect( t9.token ).to.equal( Token.ExtensionEnd );

      const t10 = lexer.next();
      expect( t10.token ).to.equal( Token.ExtensionEnd );

      const t11 = lexer.next();
      expect( t11.token ).to.equal( Token.TagEnd );
    } );

    it( 'with quoted extension', () => {
      const lexer = xamlLexer( '<Label\nContent="{Binding Name,\nConverter=\'{StaticResource\nMyConverter}\'}"/>' );

      lexer.skip( 3 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.ExtensionStart );
      expect( t1.value ).to.equal( 'Binding' );
      expect( t1.line ).to.equal( 2 );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.String );
      expect( t2.value ).to.equal( 'Name' );
      expect( t2.delimiter ).to.equal( '' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( ',' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Identifier );
      expect( t5.value ).to.equal( 'Converter' );
      expect( t5.line ).to.equal( 3 );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Operator );
      expect( t6.value ).to.equal( '=' );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.ExtensionStart );
      expect( t7.value ).to.equal( 'StaticResource' );
      expect( t7.line ).to.equal( 3 );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.String );
      expect( t8.value ).to.equal( 'MyConverter' );
      expect( t8.delimiter ).to.equal( '' );
      expect( t8.line ).to.equal( 4 );

      const t9 = lexer.next();
      expect( t9.token ).to.equal( Token.ExtensionEnd );

      const t10 = lexer.next();
      expect( t10.token ).to.equal( Token.ExtensionEnd );

      const t11 = lexer.next();
      expect( t11.token ).to.equal( Token.TagEnd );
    } );
  } );
} );
