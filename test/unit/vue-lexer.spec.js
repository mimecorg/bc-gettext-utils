const expect = require( 'chai' ).expect;

const vueLexer = require( '../../src/vue-lexer' );
const { Token } = require( '../../src/consts' );

describe( 'vueLexer', () => {
  describe( 'single tokens', () => {
    const data = [
      { title: 'opening tag', text: '<button type="button">', token: Token.TagStart, value: '<button' },
      { title: 'closing tag', text: '</template>', token: Token.TagStart, value: '</template' },
      { title: 'component', text: '<application-header>', token: Token.TagStart, value: '<application-header' },
      { title: 'code', text: '{{ f() }}', token: Token.Interpolation, value: ' f() ' },
    ];

    for ( const { title, text, token, value } of data ) {
      it( title, () => {
        const lexer = vueLexer( text );

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
      { title: 'closing tag', text: 'foobar\n</template>', value: 'foobar\n' },
      { title: 'comment', text: 'foo:<!-- comment -->', value: 'foo:' },
      { title: 'code', text: 'this is {{ f() }}', value: 'this is ' },
    ];

    for ( const { title, text, value } of data ) {
      it( title, () => {
        const lexer = vueLexer( text );

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
      { title: 'opening tag', text: '<!-- comment --><a href="#">', token: Token.TagStart, value: '<a' },
      { title: 'code', text: '<!-- this\nis\na comment -->{{x}}', token: Token.Interpolation, value: 'x', line: 3 },
    ];

    for ( const { title, text, token, value, line = 1 } of data ) {
      it( title, () => {
        const lexer = vueLexer( text );

        const result = lexer.next();

        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( line );
      } );
    }
  } );

  describe( 'tag tokens', () => {
    const data = [
      { title: 'simple identifier', text: '<a href="#">', token: Token.Identifier, value: 'href' },
      { title: 'complex identifier', text: '<a v-on:click="onClick">', token: Token.Identifier, value: 'v-on:click' },
      { title: 'binding identifier', text: '<a :href="url">', token: Token.Identifier, value: ':href' },
      { title: 'number', text: '<a 123>', token: Token.Number, value: '123' },
      { title: 'single string', text: '<a "foo">', token: Token.String, value: 'foo' },
      { title: 'double string', text: "<a 'bar'>", token: Token.String, value: 'bar' },
      { title: 'double string with LF', text: '<a "foo\nbar">', token: Token.String, value: 'foo\nbar' },
      { title: 'operator', text: "<a = >", token: Token.Operator, value: '=' },
      { title: 'tag end', text: "<a>", token: Token.TagEnd, value: '>' },
      { title: 'self-close tag end', text: "<a/>", token: Token.TagEnd, value: '/>' },
    ];

    for ( const { title, text, token, value } of data ) {
      it( title, () => {
        const lexer = vueLexer( text );
        lexer.next();

        const result = lexer.next();

        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
      } );
    }
  } );

  describe( 'raw text', () => {
    it( 'script', () => {
      const lexer = vueLexer( '<script>var code = "<a>";</script>' );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.TagStart );
      expect( t1.value ).to.equal( '<script' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.TagEnd );
      expect( t2.value ).to.equal( '>' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Text );
      expect( t3.value ).to.equal( 'var code = "<a>";' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagStart );
      expect( t4.value ).to.equal( '</script' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.TagEnd );
      expect( t5.value ).to.equal( '>' );
    } );

    it( 'style', () => {
      const lexer = vueLexer( '<style>body { color: black; }</style>' );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.TagStart );
      expect( t1.value ).to.equal( '<style' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.TagEnd );
      expect( t2.value ).to.equal( '>' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Text );
      expect( t3.value ).to.equal( 'body { color: black; }' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagStart );
      expect( t4.value ).to.equal( '</style' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.TagEnd );
      expect( t5.value ).to.equal( '>' );
    } );
  } );

  describe( 'sequence of tokens', () => {
    it( 'tag with attributes', () => {
      const lexer = vueLexer( '<a href="#">' );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.TagStart );
      expect( t1.value ).to.equal( '<a' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Identifier );
      expect( t2.value ).to.equal( 'href' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Operator );
      expect( t3.value ).to.equal( '=' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.String );
      expect( t4.value ).to.equal( '#' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.TagEnd );
      expect( t5.value ).to.equal( '>' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.EOF );
    } );

    it( 'tag with code', () => {
      const lexer = vueLexer( "<p>{{ _( 'text' ) }}</p>" );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.TagStart );
      expect( t1.value ).to.equal( '<p' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.TagEnd );
      expect( t2.value ).to.equal( '>' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Interpolation );
      expect( t3.value ).to.equal( " _( 'text' ) " );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.TagStart );
      expect( t4.value ).to.equal( '</p' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.TagEnd );
      expect( t5.value ).to.equal( '>' );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.EOF );
    } );
  } );

  describe( 'lookahead', () => {
    const text = "<p>{{ _( 'text' ) }}</p>";

    it( 'peek(n)', () => {
      const lexer = vueLexer( text );

      const result = lexer.peek( 3 );

      expect( result ).to.be.an( 'object' );
      expect( result.token ).to.equal( Token.TagStart );
      expect( result.value ).to.equal( '</p' );
    } );

    it( 'peek past end', () => {
      const lexer = vueLexer( text );

      const result = lexer.peek( 6 );

      expect( result ).to.be.an( 'object' );
      expect( result.token ).to.equal( Token.EOF );
    } );

    it( 'skip(n)', () => {
      const lexer = vueLexer( text );

      lexer.skip( 3 );

      const next = lexer.next();
      expect( next.token ).to.equal( Token.TagStart );
      expect( next.value ).to.equal( '</p' );
    } );
  } );
} );
