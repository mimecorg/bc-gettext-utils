# Bulletcode gettext utilities

`bc-gettext-utils` is a toolset for Node.js which helps creating and updating translations in a format compatible with gettext `.po` and `.mo` files. It extracts translatable strings from JavaScript and .NET source files and merges extracted translations with existing ones.

In order to load and save translations in `.po` and `.mo` formats, use the [gettext-parser](https://github.com/smhg/gettext-parser) library.

## Usage

Install using npm:

```bash
npm install bc-gettext-utils
```

Include the library:

```js
const { extractors, mergeTranslations, normalizePlurals } = require( 'bc-gettext-utils' );
```

## Extracting translations

Use the `extractors` collection of functions to extract translatable strings from a source file, e.g.:

```js
const translations = extractors.js( contents, file, [ options ] );
```

Where:

 - `contents` is the source file contents as a UTF-8 string
 - `file` is the path of the file to be included in the comments
 - `options` is the optional options (see below)

Available extractors:

 - `extractors.js` - JavaScript files
 - `extractors.vue` - Vue single-file components
 - `extractors.cs` - C# files
 - `extractors.cshtml` - Razor pages and MVC views
 - `extractors.xaml` - XAML files

The returned object follows the format used by `gettext-parser`, e.g.:

```json
{
  "": {
    "example": {
      "msgid": "example",
      "msgstr": [ "" ],
      "comments": {
        "reference": "/path/to/file:123"
      }
    }
  },
  "context": {
    "another example": {
      "msgctxt": "context",
      "msgid": "another example",
      "msgstr": [ "" ],
      "comments": {
        "reference": "/path/to/file:256"
      }
    }
  }
}
```

### JavaScript and C#

The following functions or methods are recognized in JavaScript and C# code:

```js
_( "text" );
_p( "context", "text" );
_n( "text", "plural text" );
_pn( "context", "text", "plural text" );
```

Additional arguments are ignored. The names of these functions can be customized by passing additional options to the extractor, for example:

```js
const translations = extractors.js( contents, file, {
  string: '_',
  particularString: '_p',
  pluralString: '_n',
  particularPluralString: '_pn',
} );
```

Note that string literals must be used for the extraction to work. In JavaScript, `'single quoted'` and `"double quoted"` strings are supported. In C#, `"regular"` and `@"verbatim"` string literals can be used.

Concatenation of multiple string literals using the `+` operator is also supported:

```js
_( "this is a long text\n"
 + "and this is another line" );
```

### Vue

In Vue single-file components, translatable strings can be placed in the following locations:

 - text interpolation using the "Mustache" syntax: `<p>{{ _( 'text' ) }}</p>`
 - attribute bindings: `<a v-bind:title="_( 'text' )">`
 - shorthand attribute bindings: `<a :title="_( 'text' )">`
 - the `<script>` block

### Razor

In Razor `.cshtml` files, translatable strings are extracted from:

 - Razor expressions: `@_( "text" )`
 - Razor code blocks: `@{ string title = _( "text" ) }`
 - control structures - conditionals, loops, etc.: `@if ( a > 0 ) { title = _( "text" ) }`
 - the `@functions` directive

### XAML

TODO

## Merging translations

TODO

## Normalizing plurals

TODO

