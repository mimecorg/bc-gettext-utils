const translationBuilder = require( './translation-builder' );
const codeExtractor = require( './code-extractor' );
const codeLexer = require( './code-lexer' );
const razorLexer = require( './razor-lexer' );
const vueCodeLexer = require( './vue-code-lexer' );
const vueLexer = require( './vue-lexer' );
const xamlExtractor = require( './xaml-extractor' );
const xamlLexer = require( './xaml-lexer' );
const mergeTranslations = require( './merge-translations' );
const normalizePlurals = require( './normalize-plurals' );
const compareRefence = require( './compare-reference' );
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
  xaml( text, options = {} ) {
   return xamlExtractor( xamlLexer( text ), options );
  }
};

module.exports = { translationBuilder, extractors, mergeTranslations, normalizePlurals, compareRefence };
