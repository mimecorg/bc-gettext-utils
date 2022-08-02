const Token = {
  EOF: 'EOF',
  Identifier: 'Identifier',
  Number: 'Number',
  String: 'String',
  RegExp: 'RegExp',
  Operator: 'Operator',
  TagStart: 'TagStart',
  TagEnd: 'TagEnd',
  Text: 'Text',
  Interpolation: 'Interpolation',
  Directive: 'Directive',
  CodeStart: 'CodeStart',
  CodeEnd: 'CodeEnd',
  ExtensionStart: 'ExtensionStart',
  ExtensionEnd: 'ExtensionEnd',
};

const Language = {
  CSharp: 'C#',
  JavaScript: 'JavaScript',
};

module.exports = {
  Token,
  Language,
};
