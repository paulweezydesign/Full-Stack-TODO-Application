// Advanced pattern matching for functional programming constructs

export interface TransformPattern {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description: string;
}

// Python to JavaScript patterns
export const pythonToJSPatterns: TransformPattern[] = [
  {
    pattern: /def\s+(\w+)\s*\((.*?)\)\s*:/g,
    replacement: 'const $1 = ($2) => {',
    description: 'Function definitions'
  },
  {
    pattern: /lambda\s+(.*?):\s*(.*?)(?=[\n,)])/g,
    replacement: '($1) => $2',
    description: 'Lambda functions'
  },
  {
    pattern: /print\s*\(\s*f"([^"]*?)"\s*\)/g,
    replacement: (match, content) => {
      const jsTemplate = content.replace(/\{([^}]+)\}/g, '${$1}');
      // eslint-disable-next-line no-template-curly-in-string
      return 'console.log(`' + jsTemplate + '`)';
    },
    description: 'F-string print statements'
  },
  {
    pattern: /print\s*\(\s*"([^"]*?)"\s*\)/g,
    replacement: 'console.log("$1")',
    description: 'String print statements'
  },
  {
    pattern: /print\s*\(([^)]+)\)/g,
    replacement: 'console.log($1)',
    description: 'General print statements'
  },
  {
    pattern: /list\s*\(\s*map\s*\(\s*(.*?),\s*(.*?)\s*\)\s*\)/g,
    replacement: '$2.map($1)',
    description: 'List map to array map'
  },
  {
    pattern: /list\s*\(\s*filter\s*\(\s*(.*?),\s*(.*?)\s*\)\s*\)/g,
    replacement: '$2.filter($1)',
    description: 'List filter to array filter'
  },
  {
    pattern: /(\w+)\s*=\s*\[(.*?)\]/g,
    replacement: 'const $1 = [$2]',
    description: 'List assignments'
  },
  {
    pattern: /(\w+)\s*=\s*([^=\n]+?)(?=\n|$)/g,
    replacement: 'const $1 = $2;',
    description: 'Variable assignments'
  },
  {
    pattern: /(\w+|\d+)\s*\*\*\s*(\w+|\d+)/g,
    replacement: '$1 ** $2',
    description: 'Power operator'
  },
  {
    pattern: /^(\s*)#\s*(.*?)$/gm,
    replacement: '$1// $2',
    description: 'Comments'
  },
  {
    pattern: /True/g,
    replacement: 'true',
    description: 'Boolean True'
  },
  {
    pattern: /False/g,
    replacement: 'false',
    description: 'Boolean False'
  },
  {
    pattern: /None/g,
    replacement: 'null',
    description: 'None to null'
  }
];

// JavaScript to Python patterns
export const jsToPythonPatterns: TransformPattern[] = [
  {
    pattern: /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,
    replacement: 'def $1($2):',
    description: 'Arrow function definitions'
  },
  {
    pattern: /const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>\s*([^;{]+);?/g,
    replacement: '$1 = lambda $2: $3',
    description: 'Arrow function expressions'
  },
  {
    pattern: /function\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    replacement: 'def $1($2):',
    description: 'Function declarations'
  },
  {
    pattern: /console\.log\s*\(\s*`([^`]*)`\s*\)/g,
    replacement: (match, content) => {
      const pythonFString = content.replace(/\$\{([^}]+)\}/g, '{$1}');
      return 'print(f"' + pythonFString + '")';
    },
    description: 'Template literal console.log'
  },
  {
    pattern: /console\.log\s*\(([^)]+)\)/g,
    replacement: 'print($1)',
    description: 'Console.log statements'
  },
  {
    pattern: /(\w+)\.map\s*\(([^)]+)\)/g,
    replacement: 'list(map($2, $1))',
    description: 'Array map to list map'
  },
  {
    pattern: /(\w+)\.filter\s*\(([^)]+)\)/g,
    replacement: 'list(filter($2, $1))',
    description: 'Array filter to list filter'
  },
  {
    pattern: /(\w+)\.reduce\s*\(\s*([^,]+),\s*([^)]+)\s*\)/g,
    replacement: 'reduce($2, $1, $3)',
    description: 'Array reduce to functools reduce'
  },
  {
    pattern: /(const|let|var)\s+(\w+)\s*=\s*([^;]+);?/g,
    replacement: '$2 = $3',
    description: 'Variable declarations'
  },
  {
    pattern: /;$/gm,
    replacement: '',
    description: 'Remove semicolons'
  },
  {
    pattern: /^(\s*)\/\/\s*(.*?)$/gm,
    replacement: '$1# $2',
    description: 'Comments'
  },
  {
    pattern: /true/g,
    replacement: 'True',
    description: 'Boolean true'
  },
  {
    pattern: /false/g,
    replacement: 'False',
    description: 'Boolean false'
  },
  {
    pattern: /null/g,
    replacement: 'None',
    description: 'Null to None'
  }
];

// Functional programming enhancement patterns
export const functionalEnhancements = {
  javascript: [
    {
      pattern: /for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.length;\s*\1\+\+\s*\)\s*\{([^}]+)\}/g,
      replacement: '$2.forEach((item, $1) => {$3})',
      description: 'Convert for loops to forEach'
    },
    {
      pattern: /for\s*\(\s*const\s+(\w+)\s+of\s+(\w+)\s*\)\s*\{([^}]+)\}/g,
      replacement: '$2.forEach($1 => {$3})',
      description: 'Convert for...of loops to forEach'
    }
  ],
  python: [
    {
      pattern: /for\s+(\w+)\s+in\s+range\s*\(\s*len\s*\(\s*(\w+)\s*\)\s*\)\s*:/g,
      replacement: 'for $1, item in enumerate($2):',
      description: 'Convert range(len()) to enumerate'
    }
  ]
};

export function applyPatterns(code: string, patterns: TransformPattern[]): string {
  let result = code;
  
  for (const pattern of patterns) {
    if (typeof pattern.replacement === 'string') {
      result = result.replace(pattern.pattern, pattern.replacement);
    } else {
      result = result.replace(pattern.pattern, pattern.replacement);
    }
  }
  
  return result;
}