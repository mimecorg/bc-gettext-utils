import { parseSync } from 'oxc-parser';

import { Language } from './consts.js';

export function oxcExtractor( text, language, options = {} ) {
  const {
    string = '_',
    particularString = '_p',
    pluralString = '_n',
    particularPluralString = '_pn',
    reverseContext = false,
  } = options;

  const result = [];
  let index = 0;

  const { program } = parseSync( language == Language.TypeScript ? 'input.tsx' : 'input.jsx', text );

  visit( program );

  function visit( node ) {
    if ( node.type == 'CallExpression' && node.callee.type == 'Identifier' ) {
      if ( matches( string, node.callee.name ) ) {
        const args = extractArguments( node, 1 );
        if ( args != null ) {
          result.push( { line: getLine( node ), msgid: args[ 0 ] } );
          return;
        }
      } else if ( matches( particularString, node.callee.name ) ) {
        const args = extractArguments( node, 2 );
        if ( args != null ) {
          if ( reverseContext )
            result.push( { line: getLine( node ), msgctxt: args[ 1 ], msgid: args[ 0 ] } );
          else
            result.push( { line: getLine( node ), msgctxt: args[ 0 ], msgid: args[ 1 ] } );
          return;
        }
      } else if ( matches( pluralString, node.callee.name ) ) {
        const args = extractArguments( node, 2 );
        if ( args != null ) {
          result.push( { line: getLine( node ), msgid: args[ 0 ], msgid_plural: args[ 1 ] } );
          return;
        }
      } else if ( matches( particularPluralString, node.callee.name ) ) {
        if ( reverseContext ) {
          const args = extractArgumentsReverseContext( node );
          if ( args != null ) {
            result.push( { line: getLine( node ), msgctxt: args[ 2 ], msgid: args[ 0 ], msgid_plural: args[ 1 ] } );
            return;
          }
        } else {
          const args = extractArguments( node, 3 );
          if ( args != null ) {
            result.push( { line: getLine( node ), msgctxt: args[ 0 ], msgid: args[ 1 ], msgid_plural: args[ 2 ] } );
            return;
          }
        }
      }
    }

    visitChildren( node );
  }

  function visitChildren( node ) {
    for ( const key of Object.keys( node ) ) {
      const value = node[ key ];
      if ( Array.isArray( value ) )
        value.forEach( child => child && visit( child ) );
      else if ( value != null && typeof( value ) == 'object' )
        visit( value );
    }
  }

  function extractArguments( node, count ) {
    if ( node.arguments.length < count )
      return null;

    const args = [];

    for ( let i = 0; i < count; i++ ) {
      const arg = extractString( node.arguments[ i ] );
      if ( arg == null )
        return null;
      args.push( arg );
    }

    return args;
  }

  function extractArgumentsReverseContext( node ) {
    if ( node.arguments.length < 4 )
      return null;

    const args = extractArguments( node, 2 );

    const arg = extractString( node.arguments[ 3 ] );
    if ( arg == null )
      return null;

    args.push( arg );
    return args;
  }

  function extractString( node ) {
    if ( node.type == 'Literal' )
      return node.value;

    if ( node.type == 'BinaryExpression' && node.operator == '+' ) {
      const left = extractString( node.left );
      const right = extractString( node.right );

      if ( left != null && right != null )
        return left + right;
    }

    return null;
  }

  function matches( names, value ) {
    if ( Array.isArray( names ) )
      return names.includes( value );
    return names == value;
  }

  function getLine( node ) {
    for ( let line = 1, cur = 0; ; ) {
      const nextBreak = nextLineBreak( cur, node.start );
      if ( nextBreak < 0 )
        return line;
      line++;
      cur = nextBreak;
    }
  }

  function nextLineBreak( start, end ) {
    for ( let i = start; i < end; i++ ) {
      const code = text.charCodeAt( i )
      if ( code == 10 || code == 13 || code == 0x2028 || code == 0x2029 )
        return i < end - 1 && code == 13 && text.charCodeAt( i + 1 ) == 10 ? i + 2 : i + 1;
    }
    return -1;
  }

  function next() {
    if ( index < result.length )
      return result[ index++ ];
    return null;
  }

  return {
    next,
  };
}
