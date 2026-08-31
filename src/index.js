import { codeExtractor } from './code-extractor.js';
import { codeLexer } from './code-lexer.js';
import { oxcExtractor } from './oxc-extractor.js';
import { phpLexer } from './php-lexer.js';
import { razorLexer } from './razor-lexer.js';
import { vueCodeLexer } from './vue-code-lexer.js';
import { vueLexer } from './vue-lexer.js';
import { xamlExtractor } from './xaml-extractor.js';
import { xamlLexer } from './xaml-lexer.js';
import { Language } from './consts.js';

export { translationBuilder } from './translation-builder.js';
export { mergeTranslations } from './merge-translations.js';
export { normalizePlurals } from './normalize-plurals.js';
export { compareReference } from './compare-reference.js';

function js( text, options = {} ) {
  return oxcExtractor( text, Language.JavaScript, options );
}

function ts( text, options = {} ) {
  return oxcExtractor( text, Language.TypeScript, options );
}

function cs( text, options = {} ) {
  return codeExtractor( codeLexer( text, Language.CSharp ), { extractAttributes: true }, options );
}

function vue( text, options = {} ) {
  return codeExtractor( vueCodeLexer( text, vueLexer, codeLexer ), { insideCode: false }, options );
}

function cshtml( text, options = {} ) {
  return codeExtractor( razorLexer( text, codeLexer ), { insideCode: false, extractAttributes: true }, options );
}

function xaml( text, options = {} ) {
  return xamlExtractor( xamlLexer( text ), options );
}

function php( text, options = {} ) {
  return codeExtractor( phpLexer( text, codeLexer ), { insideCode: false }, options );
}

export const extractors = {
  js,
  ts,
  cs,
  vue,
  cshtml,
  xaml,
  php,
};
