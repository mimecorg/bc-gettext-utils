const translationBuilder = require( './translation-builder' );
const codeExtractor = require( './code-extractor' );
const codeLexer = require( './code-lexer' );
const razorLexer = require( './razor-lexer' );
const vueCodeLexer = require( './vue-code-lexer' );
const vueLexer = require( './vue-lexer' );
const { Language } = require( './consts' );

const extractors = {
  js( text, options = {} ) {
    return codeExtractor( codeLexer( text, Language.JavaScript ), true, options );
  },
  cs( text, options = {} ) {
   return codeExtractor( codeLexer( text, Language.CSharp ), true, options );
  },
  vue( text, options = {} ) {
   return codeExtractor( vueCodeLexer( text, vueLexer, codeLexer ), false, options );
  },
  cshtml( text, options = {} ) {
   return codeExtractor( razorLexer( text, codeLexer ), false, options );
  },
};

module.exports = { translationBuilder, extractors };
