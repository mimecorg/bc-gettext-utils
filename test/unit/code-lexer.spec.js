const { expect } = require( 'chai' );

const codeLexer = require( '../../src/code-lexer' );
const { Token, Language } = require( '../../src/consts' );

describe( 'codeLexer', () => {
  describe( 'single tokens - C#', () => {
    const data = [
      { text: 'Foo_Bar()', token: Token.Identifier, value: 'Foo_Bar' },
      { text: '100_000+2', token: Token.Number, value: '100_000' },
      { text: '/a+/i, 2', token: Token.Operator, value: '/' },
    ];

    for ( const { text, token, value } of data ) {
      it( token, () => {
        const lexer = codeLexer( text, Language.CSharp );

        const result = lexer.next();

        expect( result ).to.be.an( 'object' );
        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( 1 );
      } );
    }
  } );

  describe( 'single tokens - JavaScript', () => {
    const data = [
      { text: 'Foo_Bar()', token: Token.Identifier, value: 'Foo_Bar' },
      { text: '100_000+2', token: Token.Number, value: '100_000' },
      { text: '/a+/i, 2', token: Token.RegExp, value: '/a+/i' },
      { text: '@"foo"', token: Token.Operator, value: '@' },
    ];

    for ( const { text, token, value } of data ) {
      it( token, () => {
        const lexer = codeLexer( text, Language.JavaScript );

        const result = lexer.next();

        expect( result ).to.be.an( 'object' );
        expect( result.token ).to.equal( token );
        expect( result.value ).to.equal( value );
        expect( result.line ).to.equal( 1 );
      } );
    }
  } );

  describe( 'string literals - C#', () => {
    const data = [
      { text: "'foobar', 2", delimiter: "'", value: 'foobar' },
      { text: '"foobar")', delimiter: '"', value: 'foobar' },
      { text: '@"foo\nbar"', delimiter: '@"', value: 'foo\nbar' },
    ];

    for ( const { text, delimiter, value } of data ) {
      it( `delimited by ${delimiter}`, () => {
        const lexer = codeLexer( text, Language.CSharp );

        const result = lexer.next();

        expect( result ).to.be.an( 'object' );
        expect( result.token ).to.equal( Token.String );
        expect( result.value ).to.equal( value );
        expect( result.delimiter ).to.equal( delimiter );
        expect( result.line ).to.equal( 1 );
      } );
    }
  } );

  describe( 'string literals - JavaScript', () => {
    const data = [
      { text: "'foobar', 2", delimiter: "'", value: 'foobar' },
      { text: '"foobar")', delimiter: '"', value: 'foobar' },
      { text: "`foo${bar}`+'a'", delimiter: "`", value: 'foo${bar}' },
    ];

    for ( const { text, delimiter, value } of data ) {
      it( `delimited by ${delimiter}`, () => {
        const lexer = codeLexer( text, Language.JavaScript );

        const result = lexer.next();

        expect( result ).to.be.an( 'object' );
        expect( result.token ).to.equal( Token.String );
        expect( result.value ).to.equal( value );
        expect( result.delimiter ).to.equal( delimiter );
        expect( result.line ).to.equal( 1 );
      } );
    }
  } );

  describe( 'escape characters', () => {
    it( 'string literal', () => {
      const lexer = codeLexer( '"foo\\r\\nbar\\tone\\\\two\\"three"', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.String );
      expect( result.value ).to.equal( 'foo\r\nbar\tone\\two"three' );
    } );

    it( 'verbatim string literal', () => {
      const lexer = codeLexer( '@"foo\\r\\nbar""text"""', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.String );
      expect( result.value ).to.equal( 'foo\\r\\nbar"text"' );
    } );

    it( 'regexp literal', () => {
      const lexer = codeLexer( '/a\\/b\\\\c/ui', Language.JavaScript );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.RegExp );
      expect( result.value ).to.equal( '/a\\/b\\\\c/ui' );
    } );
  } );

  describe( '/ character', () => {
    it( 'divide operator', () => {
      const lexer = codeLexer( '1/2/i', Language.JavaScript );
      lexer.next();

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Operator );
      expect( result.value ).to.equal( '/' );
    } );

    it( 'regexp delimiter', () => {
      const lexer = codeLexer( '=/2/i', Language.JavaScript );
      lexer.next();

      const result = lexer.next();

      expect( result.token ).to.equal( Token.RegExp );
      expect( result.value ).to.equal( '/2/i' );
    } );

    it( 'JSX close tag', () => {
      const lexer = codeLexer( '</p>', Language.JavaScript );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Operator );
      expect( result.value ).to.equal( '</' );
    } );
  } );

  describe( 'skip whitespace', () => {
    it( 'spaces', () => {
      const lexer = codeLexer( '   foo', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Identifier );
      expect( result.value ).to.equal( 'foo' );
    } );

    it( 'tabs', () => {
      const lexer = codeLexer( '\t\tfoo', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Identifier );
      expect( result.value ).to.equal( 'foo' );
    } );

    it( 'LF', () => {
      const lexer = codeLexer( '\n\n\nfoo' );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Identifier );
      expect( result.value ).to.equal( 'foo' );
      expect( result.line ).to.equal( 4 );
    } );

    it( 'CR+LF', () => {
      const lexer = codeLexer( '\r\n\r\nfoo', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Identifier );
      expect( result.value ).to.equal( 'foo' );
      expect( result.line ).to.equal( 3 );
    } );

    it( 'end of file', () => {
      const lexer = codeLexer( '\n\n', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.EOF );
    } );
  } );

  describe( 'skip comments', () => {
    it( 'single-line', () => {
      const lexer = codeLexer( '// comment\nfoo', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Identifier );
      expect( result.value ).to.equal( 'foo' );
    } );

    it( 'multi-line', () => {
      const lexer = codeLexer( '/* line1\n line2\n line3 */\nfoo', Language.CSharp );

      const result = lexer.next();

      expect( result.token ).to.equal( Token.Identifier );
      expect( result.value ).to.equal( 'foo' );
      expect( result.line ).to.equal( 4 );
    } );
  } );

  describe( 'sequence of tokens', () => {
    it( 'single line', () => {
      const lexer = codeLexer( "_( 'text' )", Language.CSharp );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.Identifier );
      expect( t1.value ).to.equal( '_' );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Operator );
      expect( t2.value ).to.equal( '(' );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.String );
      expect( t3.value ).to.equal( 'text' );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.Operator );
      expect( t4.value ).to.equal( ')' );

      const t5 = lexer.next();
      expect( t5.token ).to.equal( Token.EOF );
    } );

    it( 'multiple lines', () => {
      const lexer = codeLexer( '\nline2\n\nline4\nline5', Language.CSharp );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.Identifier );
      expect( t1.value ).to.equal( 'line2' );
      expect( t1.line ).to.equal( 2 );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Identifier );
      expect( t2.value ).to.equal( 'line4' );
      expect( t2.line ).to.equal( 4 );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.Identifier );
      expect( t3.value ).to.equal( 'line5' );
      expect( t3.line ).to.equal( 5 );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.EOF );
    } );

    it( 'with comments', () => {
      const lexer = codeLexer( '/* comment1 */\nfoo // comment2\nbar /* comment2 */ "text"', Language.CSharp );

      const t1 = lexer.next();
      expect( t1.token ).to.equal( Token.Identifier );
      expect( t1.value ).to.equal( 'foo' );
      expect( t1.line ).to.equal( 2 );

      const t2 = lexer.next();
      expect( t2.token ).to.equal( Token.Identifier );
      expect( t2.value ).to.equal( 'bar' );
      expect( t2.line ).to.equal( 3 );

      const t3 = lexer.next();
      expect( t3.token ).to.equal( Token.String );
      expect( t3.value ).to.equal( 'text' );
      expect( t3.line ).to.equal( 3 );

      const t4 = lexer.next();
      expect( t4.token ).to.equal( Token.EOF );
    } );
  } );

  describe( 'lookahead', () => {
    const text = "_p( 'context', 'text' )";

    it( 'peek(n)', () => {
      const lexer = codeLexer( text, Language.CSharp );

      const result = lexer.peek( 2 );

      expect( result ).to.be.an( 'object' );
      expect( result.token ).to.equal( Token.String );
      expect( result.value ).to.equal( 'context' );
    } );

    it( 'peek past end', () => {
      const lexer = codeLexer( text, Language.CSharp );

      const result = lexer.peek( 8 );

      expect( result ).to.be.an( 'object' );
      expect( result.token ).to.equal( Token.EOF );
    } );

    it( 'skip(n)', () => {
      const lexer = codeLexer( text, Language.CSharp );

      lexer.skip( 3 );

      const next = lexer.next();
      expect( next.token ).to.equal( Token.Operator );
      expect( next.value ).to.equal( ',' );
    } );
  } );
} );
