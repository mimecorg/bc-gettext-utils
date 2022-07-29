const expect = require( 'chai' ).expect;

const vueCodeLexer = require( '../../src/vue-code-lexer' );
const codeLexer = require( '../../src/code-lexer' );
const vueLexer = require( '../../src/vue-lexer' );
const { Token } = require( '../../src/consts' );

describe( 'vueCodeLexer', () => {
  const data = [
    { title: 'interpolation', text: '<template><p>{{ F() }}<p></template>' },
    { title: 'attribute binding', text: '<template><a v-bind:href="F()">link<a></template>' },
    { title: 'shorthand binding', text: '<template><a :href="F()">link<a></template>' },
  ];

  for ( const { title, text } of data ) {
    it( title, () => {
      const lexer = vueCodeLexer( text, vueLexer, codeLexer );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.CodeStart );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Identifier );
      expect( t2.value ).to.equal( 'F' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Operator );
      expect( t3.value ).to.equal( '(' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( ')' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.CodeEnd );

      const t6 = lexer.next();
      expect( t6.token ).to.equal( Token.EOF );
    } );
  }

  it( 'script block', () => {
    const lexer = vueCodeLexer( '<template>\n<p>test</p>\n</template>\n<script>\nF();\nG();</script>', vueLexer, codeLexer );

    const t1 = lexer.next();
    expect( t1.token ).to.equal( Token.CodeStart );

    const t2 = lexer.next();
    expect( t2.token ).to.equal( Token.Identifier );
    expect( t2.value ).to.equal( 'F' );
    expect( t2.line ).to.equal( 5 );

    lexer.skip( 3 );

    const t3 = lexer.next();
    expect( t3.token ).to.equal( Token.Identifier );
    expect( t3.value ).to.equal( 'G' );
    expect( t3.line ).to.equal( 6 );

    lexer.skip( 3 );

    const t4 = lexer.next();
    expect( t4.token ).to.equal( Token.CodeEnd );

    const t5 = lexer.next();
    expect( t5.token ).to.equal( Token.EOF );
  } );

  it( 'multiple code sequences', () => {
    const lexer = vueCodeLexer( '<template>\n<p :class="classes">{{ message }}</p>\n</template>\n<script>\nF();</script>', vueLexer, codeLexer );

    const t1 = lexer.next();
    expect( t1.token ).to.equal( Token.CodeStart );

    const t2 = lexer.next();
    expect( t2.token ).to.equal( Token.Identifier );
    expect( t2.value ).to.equal( 'classes' );
    expect( t2.line ).to.equal( 2 );

    const t3 = lexer.next();
    expect( t3.token ).to.equal( Token.CodeEnd );

    const t4 = lexer.next();
    expect( t4.token ).to.equal( Token.CodeStart );

    const t5 = lexer.next();
    expect( t5.token ).to.equal( Token.Identifier );
    expect( t5.value ).to.equal( 'message' );
    expect( t5.line ).to.equal( 2 );

    const t6 = lexer.next();
    expect( t6.token ).to.equal( Token.CodeEnd );

    const t7 = lexer.next();
    expect( t7.token ).to.equal( Token.CodeStart );

    const t8 = lexer.next();
    expect( t8.token ).to.equal( Token.Identifier );
    expect( t8.value ).to.equal( 'F' );
    expect( t8.line ).to.equal( 5 );

    lexer.skip( 3 );

    const t9 = lexer.next();
    expect( t9.token ).to.equal( Token.CodeEnd );

    const t10 = lexer.next();
    expect( t10.token ).to.equal( Token.EOF );
  } );
} );
