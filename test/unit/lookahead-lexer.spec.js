const { expect } = require( 'chai' );

const lookaheadLexer = require( '../../src/lookahead-lexer' );

describe( 'lookaheadLexer', () => {
  let counter;

  beforeEach( () => {
    counter = 0;
  } );

  function getToken() {
    return { token: counter++ };
  }

  it( 'next()', () => {
    const lexer = lookaheadLexer( getToken );

    const result = lexer.next();

    expect( result ).to.be.an( 'object' );
    expect( result.token ).to.equal( 0 );
    expect( counter ).to.equal( 1 );
  } );

  it( 'peek()', () => {
    const lexer = lookaheadLexer( getToken );

    const result = lexer.peek();

    expect( result ).to.be.an( 'object' );
    expect( result.token ).to.equal( 0 );
    expect( counter ).to.equal( 1 );
  } );

  it( 'peek(n)', () => {
    const lexer = lookaheadLexer( getToken );

    const result = lexer.peek( 2 );

    expect( result ).to.be.an( 'object' );
    expect( result.token ).to.equal( 2 );
    expect( counter ).to.equal( 3 );
  } );

  it( 'skip()', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.skip();

    const next = lexer.next();
    expect( next.token ).to.equal( 1 );
    expect( counter ).to.equal( 2 );
  } );

  it( 'skip(n)', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.skip( 3 );

    const next = lexer.next();
    expect( next.token ).to.equal( 3 );
    expect( counter ).to.equal( 4 );
  } );

  it( 'peek() + next()', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.peek();

    const result = lexer.next();

    expect( result ).to.be.an( 'object' );
    expect( result.token ).to.equal( 0 );
    expect( counter ).to.equal( 1 );
  } );

  it( 'peek(n) + next()', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.peek( 2 );

    const result = lexer.next();

    expect( result ).to.be.an( 'object' );
    expect( result.token ).to.equal( 0 );
    expect( counter ).to.equal( 3 );
  } );

  it( 'peek() + skip()', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.peek();
    lexer.skip();

    const next = lexer.next();
    expect( next.token ).to.equal( 1 );
    expect( counter ).to.equal( 2 );
  } );

  it( 'peek(n) + skip()', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.peek( 2 );
    lexer.skip();

    const next = lexer.next();
    expect( next.token ).to.equal( 1 );
    expect( counter ).to.equal( 3 );
  } );

  it( 'peek(n) + skip(n)', () => {
    const lexer = lookaheadLexer( getToken );

    lexer.peek( 2 );
    lexer.skip( 3 );

    const next = lexer.next();
    expect( next.token ).to.equal( 3 );
    expect( counter ).to.equal( 4 );
  } );
} );
