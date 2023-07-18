const { expect } = require( 'chai' );

const phpLexer = require( '../../src/php-lexer' );
const codeLexer = require( '../../src/code-lexer' );
const { Token } = require( '../../src/consts' );

describe( 'phpLexer', () => {
  it( 'code block', () => {
    const lexer = phpLexer( 'test\n<?php\nf();\n?>me', codeLexer );

    const t1 = lexer.next();
    expect( t1.token ).to.equal( Token.Text );
    expect( t1.value ).to.equal( 'test\n' );

    const t2 = lexer.next();
    expect( t2.token ).to.equal( Token.CodeStart );

    const t3 = lexer.next();
    expect( t3.token ).to.equal( Token.Identifier );
    expect( t3.value ).to.equal( 'f' );
    expect( t3.line ).to.equal( 3 );

    const t4 = lexer.next();
    expect( t4.token ).to.equal( Token.Operator );
    expect( t4.value ).to.equal( '(' );

    const t5 = lexer.next();
    expect( t5.token ).to.equal( Token.Operator );
    expect( t5.value ).to.equal( ')' );

    const t6 = lexer.next();
    expect( t6.token ).to.equal( Token.Operator );
    expect( t6.value ).to.equal( ';' );

    const t7 = lexer.next();
    expect( t7.token ).to.equal( Token.CodeEnd );

    const t8 = lexer.next();
    expect( t8.token ).to.equal( Token.Text );
    expect( t8.value ).to.equal( 'me' );
    expect( t8.line ).to.equal( 4 );

    const t9 = lexer.next();
    expect( t9.token ).to.equal( Token.EOF );
  } );

  it( 'short tag', () => {
    const lexer = phpLexer( 'test<?= $f ?>me', codeLexer );

    const t1 = lexer.next();
    expect( t1.token ).to.equal( Token.Text );
    expect( t1.value ).to.equal( 'test' );

    const t2 = lexer.next();
    expect( t2.token ).to.equal( Token.CodeStart );

    const t3 = lexer.next();
    expect( t3.token ).to.equal( Token.Identifier );
    expect( t3.value ).to.equal( '$f' );

    const t4 = lexer.next();
    expect( t4.token ).to.equal( Token.CodeEnd );

    const t5 = lexer.next();
    expect( t5.token ).to.equal( Token.Text );
    expect( t5.value ).to.equal( 'me' );

    const t6 = lexer.next();
    expect( t6.token ).to.equal( Token.EOF );
  } );

  it( 'unclosed code block', () => {
    const lexer = phpLexer( '<?php f();', codeLexer );

    const t1 = lexer.next();
    expect( t1.token ).to.equal( Token.CodeStart );

    const t2 = lexer.next();
    expect( t2.token ).to.equal( Token.Identifier );
    expect( t2.value ).to.equal( 'f' );

    const t3 = lexer.next();
    expect( t3.token ).to.equal( Token.Operator );
    expect( t3.value ).to.equal( '(' );

    const t4 = lexer.next();
    expect( t4.token ).to.equal( Token.Operator );
    expect( t4.value ).to.equal( ')' );

    const t5 = lexer.next();
    expect( t5.token ).to.equal( Token.Operator );
    expect( t5.value ).to.equal( ';' );

    const t6 = lexer.next();
    expect( t6.token ).to.equal( Token.EOF );
  } );
} );
