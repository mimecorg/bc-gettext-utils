function test( a, b ) {
  console.log( _( "Hello, world!" ) );
  if ( a > 0 )
    console.log( _n( 'There is one warning.', 'There are {0} warnings.', a, a ) );
  if ( b )
    console.log( _p( 'database', 'table' ) );
  else
    console.log( _p( 'kitchen', 'table' ) );
  for ( let i = 1; i < 10; i++ )
    console.log( _pn( 'database', 'a table', '{0} tables', i, i ) );
}
