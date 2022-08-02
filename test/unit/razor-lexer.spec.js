const { expect } = require( 'chai' );

const razorLexer = require( '../../src/razor-lexer' );
const codeLexer = require( '../../src/code-lexer' );
const { Token } = require( '../../src/consts' );

describe( 'razorLexer', () => {
  describe( 'single tokens', () => {
    const data = [
      { title: 'opening tag', text: '<button type="button">', token: Token.TagStart, value: '<button' },
      { title: 'closing tag', text: '</body>', token: Token.TagStart, value: '</body' },
      { title: '@@', text: '@@', token: Token.Text, value: '@' },
    ];

    for ( const { title, text, token, value } of data ) {
      it( title, () => {
        const lexer = razorLexer( text );

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
      { title: 'opening tag', text: 'this is a <button type="button">', value: 'this is a ' },
      { title: 'closing tag', text: 'foobar\n</body>', value: 'foobar\n' },
      { title: 'comment', text: 'foo:<!-- comment -->', value: 'foo:' },
      { title: 'Razor tag', text: 'this is @Model.Name', value: 'this is ' },
    ];

    for ( const { title, text, value } of data ) {
      it( title, () => {
        const lexer = razorLexer( text );

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
      { title: 'HTML comment', text: '<!-- comment --><a href="#">', token: Token.TagStart, value: '<a' },
      { title: 'Razor comment', text: '@* this\nis\na comment *@ text', token: Token.Text, value: ' text', line: 3 },
    ];

    for ( const { title, text, token, value, line = 1 } of data ) {
      it( title, () => {
        const lexer = razorLexer( text );

        const result = lexer.next();

        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( line );
      } );
    }
  } );

  describe( 'code blocks', () => {
    const data = [
      { title: 'simple code', text: '@{ A; } text', length: 2, value: ' text' },
      { title: 'complex code', text: '@{ if ( A ) { B(); } else { C = new D { X } } }( text )', length: 20, value: '( text )' },
      { title: '@functions directive', text: '@functions { public void Test() {} } text', length: 7, value: ' text' },
    ];

    for ( const { title, text, length, value } of data ) {
      it( title, () => {
        const lexer = razorLexer( text, codeLexer );

        const t1 = lexer.next();
        expect( t1.token ).to.equal( Token.CodeStart );

        const t2 = lexer.next();
        expect( t2.token ).to.equal( Token.Operator );
        expect( t2.value ).to.equal( '{' );

        lexer.skip( length );

        const t3 = lexer.next();
        expect( t3.token ).to.equal( Token.Operator );
        expect( t3.value ).to.equal( '}' );

        const t4 = lexer.next();
        expect( t4.token ).to.equal( Token.CodeEnd );

        const t5 = lexer.next();
        expect( t5.token ).to.equal( Token.Text );
        expect( t5.value ).to.equal( value );
      } );
    }
  } );

  describe( 'code statements', () => {
    const data = [
      { title: 'if ;', text: '@if ( a ) F(); text', length: 8, value: ' text' },
      { title: 'if {}', text: '@if ( a ) { F(); } text', length: 10, value: ' text' },
      { title: 'if ; else ;', text: '@if ( a ) F(); else G(); text', length: 13, value: ' text' },
      { title: 'if {} else if {}', text: '@if ( a ) { F(); } else if ( b ) { G(); } text', length: 21, value: ' text' },
      { title: 'switch', text: '@switch ( a ) { case 0: F(); break; } else', length: 15, value: ' else' },
      { title: 'for ;', text: '@for ( a = 0; a < 10; a++ ) F(); text', length: 18, value: ' text' },
      { title: 'for {}', text: '@for ( a = 0; a < 10; a++ ) { F(); } text', length: 20, value: ' text' },
      { title: 'foreach', text: '@foreach ( var a in b ) { F(); } text', length: 13, value: ' text' },
      { title: 'while', text: '@while ( true ) { F(); } do', length: 10, value: ' do' },
      { title: 'using', text: '@using ( var a = F() ) { G(); } text', length: 15, value: ' text' },
      { title: 'lock', text: '@lock ( a ) { F(); } text', length: 10, value: ' text' },
      { title: 'do while', text: '@do { F(); } while ( true ); text', length: 12, value: ' text' },
      { title: 'try catch finally', text: '@try { F(); } catch ( Exception ) { G(); } finally { H(); } text', length: 24, value: ' text' },
    ];

    for ( const { title, text, length, value } of data ) {
      it( title, () => {
        const lexer = razorLexer( text, codeLexer );

        const t1 = lexer.next();
        expect( t1.token ).to.equal( Token.CodeStart );

        lexer.skip( length );

        const t4 = lexer.next();
        expect( t4.token ).to.equal( Token.CodeEnd );

        const t5 = lexer.next();
        expect( t5.token ).to.equal( Token.Text );
        expect( t5.value ).to.equal( value );
      } );
    }
  } );

  describe( 'inline code', () => {
    const data = [
      { title: '@()', text: '@( a + b ) text', length: 5, value: ' text' },
      { title: '@_p()', text: '@_p( "a", "b" ) text', length: 6, value: ' text' },
      { title: '@Model.Text', text: '@Model.Text is ok', length: 3, value: ' is ok' },
      { title: '@Model. Text', text: '@Model. Text', length: 1, value: '. Text' },
      { title: '@Model (Text)', text: '@Model (Text)', length: 1, value: ' (Text)' },
      { title: '@await F()', text: '@await F() await', length: 4, value: ' await' },
      { title: '@F().B[].C', text: '@F( a ).B[ i ].C+text', length: 11, value: '+text' },
    ];

    for ( const { title, text, length, value } of data ) {
      it( title, () => {
        const lexer = razorLexer( text, codeLexer );

        const t1 = lexer.next();
        expect( t1.token ).to.equal( Token.CodeStart );

        lexer.skip( length );

        const t4 = lexer.next();
        expect( t4.token ).to.equal( Token.CodeEnd );

        const t5 = lexer.next();
        expect( t5.token ).to.equal( Token.Text );
        expect( t5.value ).to.equal( value );
      } );
    }
  } );

  describe( 'directives', () => {
    const data = [
      { title: '@model', text: '@model HomeViewModel\ntext', value: '@model HomeViewModel', value2: '\ntext' },
      { title: '@inject', text: '@inject IService service\ntext', value: '@inject IService service', value2: '\ntext' },
      { title: '@using', text: '@using App.Web.Models\ntext', value: '@using App.Web.Models', value2: '\ntext' },
    ];

    for ( const { title, text, value, value2 } of data ) {
      it( title, () => {
        const lexer = razorLexer( text, codeLexer );

        const t1 = lexer.next();
        expect( t1.token ).to.equal( Token.Directive );
        expect( t1.value ).to.equal( value );

        const t2 = lexer.next();
        expect( t2.token ).to.equal( Token.Text );
        expect( t2.value ).to.equal( value2 );
      } );
    }

    it( '@section', () => {
      const lexer = razorLexer( '@section Scripts { <script src="index.js"></script> } text', codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.Directive );
      expect( t1.value ).to.equal( '@section' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Text );
      expect( t2.value ).to.equal( ' Scripts { ' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.TagStart );
      expect( t3.value ).to.equal( '<script' );

      lexer.skip( 6 );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Text );
      expect( t4.value ).to.equal( ' } text' );
    } );
  } );

  describe( 'HTML inside code', () => {
    it( 'simple tag', () => {
      const lexer = razorLexer( "@{ A(); <p>hello!</p> }", codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeStart );

      lexer.skip( 5 );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.CodeEnd );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.TagStart );
      expect( t3.value ).to.equal( '<p' );

      lexer.skip( 4 );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.CodeStart );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Operator );
      expect( t5.value ).to.equal( '}' );
    } );

    it( '< operator', () => {
      const lexer = razorLexer( "@{ if (a<b) F(); }", codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeStart );

      lexer.skip( 4 );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Operator );
      expect( t2.value ).to.equal( '<' );
    } );

    it( 'nested tags', () => {
      const lexer = razorLexer( "@{ <div><h1>title</h1><div>body</div></div> F(); }", codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeStart );

      lexer.skip();

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.CodeEnd );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.TagStart );
      expect( t3.value ).to.equal( '<div' );

      lexer.skip( 13 );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.CodeStart );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Identifier );
      expect( t5.value ).to.equal( 'F' );
    } );

    it( 'nested tags and code', () => {
      const lexer = razorLexer( "@{\n<div>\n@{\n<p>@id</p>\n}\n</div>\n}", codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeStart );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Operator );
      expect( t2.value ).to.equal( '{' );
      expect( t2.line ).to.equal( 1 );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.CodeEnd );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagStart );
      expect( t4.value ).to.equal( '<div' );
      expect( t4.line ).to.equal( 2 );

      lexer.skip( 2 );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.CodeStart );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Operator );
      expect( t6.value ).to.equal( '{' );
      expect( t6.line ).to.equal( 3 );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.CodeEnd );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.TagStart );
      expect( t8.value ).to.equal( '<p' );
      expect( t8.line ).to.equal( 4 );

      lexer.skip();

      const t9 = lexer.next();
      expect( t9.token ).to.equal( Token.CodeStart );

      const t10 = lexer.next();
      expect( t10.token ).to.equal( Token.Identifier );
      expect( t10.value ).to.equal( 'id' );
      expect( t10.line ).to.equal( 4 );

      const t11 = lexer.next();
      expect( t11.token ).to.equal( Token.CodeEnd );

      const t12 = lexer.next();
      expect( t12.token ).to.equal( Token.TagStart );
      expect( t12.value ).to.equal( '</p' );
      expect( t12.line ).to.equal( 4 );

      lexer.skip( 8 );

      const t13 = lexer.next();
      expect( t13.token ).to.equal( Token.Operator );
      expect( t13.value ).to.equal( '}' );
      expect( t13.line ).to.equal( 7 );

      const t14 = lexer.next();
      expect( t14.token ).to.equal( Token.CodeEnd );
    } );

    it( '@:', () => {
      const lexer = razorLexer( "@{\n@: hello, @name!\nF();\n}", codeLexer );

      lexer.skip( 2 );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeEnd );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Text );
      expect( t2.value ).to.equal( ' hello, ' );
      expect( t2.line ).to.equal( 2 );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.CodeStart );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Identifier );
      expect( t4.value ).to.equal( 'name' );
      expect( t4.line ).to.equal( 2 );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.CodeEnd );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Text );
      expect( t6.value ).to.equal( '!\n' );
      expect( t6.line ).to.equal( 2 );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.CodeStart );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.Identifier );
      expect( t8.value ).to.equal( 'F' );
      expect( t8.line ).to.equal( 3 );
    } );
  } );

  describe( 'skip comments inside code', () => {
    const data = [
      { title: '/* */', text: '@{ /* comment */ F(); }', value: 'F' },
      { title: '@* *@', text: '@{ @* comment *@ F(); }', value: 'F' },
      { title: '<!-- -->', text: '@{ <!-- comment --> F(); }', value: 'F' },
    ];

    for ( const { title, text, value } of data ) {
      it( title, () => {
        const lexer = razorLexer( text, codeLexer );

        lexer.skip( 2 );

        const result = lexer.next();

        expect( result.token ).to.equal( Token.Identifier );
        expect( result.value ).to.equal( value );
      } );
    }
  } );

  describe( 'sequence of tokens', () => {
    it( 'single line', () => {
      const lexer = razorLexer( "@_( 'text' )", codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeStart );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Identifier );
      expect( t2.value ).to.equal( '_' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Operator );
      expect( t3.value ).to.equal( '(' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.String );
      expect( t4.value ).to.equal( 'text' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Operator );
      expect( t5.value ).to.equal( ')' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.CodeEnd );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.EOF );
    } );

    it( 'multiple lines', () => {
      const lexer = razorLexer( "before\n@{\nF();\n}\nafter", codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.Text );
      expect( t1.value ).to.equal( 'before\n' );
      expect( t1.line ).to.equal( 1 );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.CodeStart );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Operator );
      expect( t3.value ).to.equal( '{' );
      expect( t3.line ).to.equal( 2 );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Identifier );
      expect( t4.value ).to.equal( 'F' );
      expect( t4.line ).to.equal( 3 );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.Operator );
      expect( t5.value ).to.equal( '(' );
      expect( t5.line ).to.equal( 3 );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.Operator );
      expect( t6.value ).to.equal( ')' );
      expect( t6.line ).to.equal( 3 );

      const t7 = lexer.next();
      expect( t7.token ).to.equal( Token.Operator );
      expect( t7.value ).to.equal( ';' );
      expect( t7.line ).to.equal( 3 );

      const t8 = lexer.next();
      expect( t8.token ).to.equal( Token.Operator );
      expect( t8.value ).to.equal( '}' );
      expect( t8.line ).to.equal( 4 );

      const t9 = lexer.next();
      expect( t9.token ).to.equal( Token.CodeEnd );

      const t10 = lexer.next();
      expect( t10.token ).to.equal( Token.Text );
      expect( t10.value ).to.equal( '\nafter' );
      expect( t10.line ).to.equal( 4 );
    } );
  } );

  describe( 'lookahead', () => {
    const text = '@_p( "context", "text" )';

    it( 'peek(n)', () => {
      const lexer = razorLexer( text, codeLexer );

      const result = lexer.peek( 3 );

      expect( result ).to.be.an( 'object' );
      expect( result.token ).to.equal( Token.String );
      expect( result.value ).to.equal( 'context' );
    } );

    it( 'peek past end', () => {
      const lexer = razorLexer( text, codeLexer );

      const result = lexer.peek( 10 );

      expect( result ).to.be.an( 'object' );
      expect( result.token ).to.equal( Token.EOF );
    } );

    it( 'skip(n)', () => {
      const lexer = razorLexer( text, codeLexer );

      lexer.skip( 4 );

      const next = lexer.next();
      expect( next.token ).to.equal( Token.Operator );
      expect( next.value ).to.equal( ',' );
    } );
  } );

} );
