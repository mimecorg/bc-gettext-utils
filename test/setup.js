const chai = require( 'chai' );

const { equalLineByLine } = require( './helpers/assertions' );

chai.use( equalLineByLine );
