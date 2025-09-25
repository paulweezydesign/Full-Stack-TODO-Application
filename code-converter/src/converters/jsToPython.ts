import { ConversionResult } from './pythonToJs';

export function javaScriptToPython(jsCode: string): ConversionResult {
  try {
    let pythonCode = jsCode;

    // Convert console.log to print
    pythonCode = pythonCode.replace(/console\.(log|error|warn)\s*\((.*?)\)/g, 'print($2)');

    // Convert const/let/var to Python variable declaration (just remove them)
    pythonCode = pythonCode.replace(/\b(const|let|var)\s+/g, '');

    // Convert arrow functions to def
    pythonCode = pythonCode.replace(/(\w+)\s*=\s*\((.*?)\)\s*=>\s*\{/g, 'def $1($2):');
    pythonCode = pythonCode.replace(/(\w+)\s*=\s*\((.*?)\)\s*=>\s*(.+)$/gm, 'def $1($2):\n    return $3');

    // Convert function keyword
    pythonCode = pythonCode.replace(/function\s+(\w+)\s*\((.*?)\)\s*\{/g, 'def $1($2):');

    // Convert class methods
    pythonCode = pythonCode.replace(/(\w+)\s*\((.*?)\)\s*\{/g, (match, methodName, params) => {
      if (methodName === 'constructor') {
        return `def __init__(self${params ? ', ' + params : ''}):`;
      }
      return `def ${methodName}(self${params ? ', ' + params : ''}):`;
    });

    // Convert class definitions
    pythonCode = pythonCode.replace(/class\s+(\w+)\s*(?:extends\s+(\w+))?\s*\{/g, (match, className, parent) => {
      if (parent) {
        return `class ${className}(${parent}):`;
      }
      return `class ${className}:`;
    });

    // Convert this to self
    pythonCode = pythonCode.replace(/\bthis\b/g, 'self');

    // Convert true/false/null
    pythonCode = pythonCode.replace(/\btrue\b/g, 'True');
    pythonCode = pythonCode.replace(/\bfalse\b/g, 'False');
    pythonCode = pythonCode.replace(/\bnull\b/g, 'None');
    pythonCode = pythonCode.replace(/\bundefined\b/g, 'None');

    // Convert else if to elif
    pythonCode = pythonCode.replace(/\belse\s+if\b/g, 'elif');

    // Convert array methods
    pythonCode = pythonCode.replace(/\.push\s*\((.*?)\)/g, '.append($1)');
    pythonCode = pythonCode.replace(/\.unshift\s*\((.*?)\)/g, '.insert(0, $1)');
    pythonCode = pythonCode.replace(/\.shift\s*\(\)/g, '.pop(0)');
    pythonCode = pythonCode.replace(/\.pop\s*\(\)/g, '.pop()');

    // Convert .length to len()
    pythonCode = pythonCode.replace(/(\w+)\.length/g, 'len($1)');

    // Convert Array.from
    pythonCode = pythonCode.replace(/Array\.from\s*\(\s*\{\s*length:\s*(\d+)\s*\}\s*,\s*\(.*?\)\s*=>\s*(.*?)\)/g, 'range($1)');

    // Convert template literals to f-strings
    pythonCode = pythonCode.replace(/`([^`]*)`/g, (match, content) => {
      const replaced = content.replace(/\$\{(\w+)\}/g, '{$1}');
      return `f"${replaced}"`;
    });

    // Convert for...of loops
    pythonCode = pythonCode.replace(/for\s*\(\s*(?:const|let|var)?\s*(\w+)\s+of\s+(.*?)\)\s*\{/g, 'for $1 in $2:');

    // Convert for loops
    pythonCode = pythonCode.replace(/for\s*\(\s*(?:const|let|var)?\s*(\w+)\s*=\s*(\d+);\s*\1\s*<\s*(\w+);\s*\1\+\+\)\s*\{/g, 'for $1 in range($2, $3):');

    // Convert while loops
    pythonCode = pythonCode.replace(/while\s*\((.*?)\)\s*\{/g, 'while $1:');

    // Convert if statements
    pythonCode = pythonCode.replace(/if\s*\((.*?)\)\s*\{/g, 'if $1:');

    // Convert try/catch to try/except
    pythonCode = pythonCode.replace(/try\s*\{/g, 'try:');
    pythonCode = pythonCode.replace(/catch\s*\((\w+)\)\s*\{/g, 'except Exception as $1:');
    pythonCode = pythonCode.replace(/catch\s*\{/g, 'except:');
    pythonCode = pythonCode.replace(/finally\s*\{/g, 'finally:');

    // Convert import statements
    pythonCode = pythonCode.replace(/import\s*\{\s*(.*?)\s*\}\s*from\s*['"](.*)['"];?/g, 'from $2 import $1');
    pythonCode = pythonCode.replace(/import\s+['"](.*)['"];?/g, 'import $1');

    // Convert logical operators
    pythonCode = pythonCode.replace(/\s&&\s/g, ' and ');
    pythonCode = pythonCode.replace(/\s\|\|\s/g, ' or ');
    pythonCode = pythonCode.replace(/\s!\s/g, ' not ');
    pythonCode = pythonCode.replace(/!(\w+)/g, 'not $1');

    // Convert === and !== to == and !=
    pythonCode = pythonCode.replace(/===/g, '==');
    pythonCode = pythonCode.replace(/!==/g, '!=');

    // Remove semicolons
    pythonCode = pythonCode.replace(/;$/gm, '');

    // Convert object/array destructuring (basic)
    pythonCode = pythonCode.replace(/\{\s*(\w+)\s*\}\s*=\s*(\w+)/g, '$1 = $2["$1"]');
    pythonCode = pythonCode.replace(/\[\s*(\w+)\s*\]\s*=\s*(\w+)/g, '$1 = $2[0]');

    // Convert map/filter/reduce (basic)
    pythonCode = pythonCode.replace(/(\w+)\.map\s*\(\s*(\w+)\s*=>\s*(.*?)\)/g, '[$3 for $2 in $1]');
    pythonCode = pythonCode.replace(/(\w+)\.filter\s*\(\s*(\w+)\s*=>\s*(.*?)\)/g, '[$2 for $2 in $1 if $3]');

    // Remove closing braces and adjust indentation
    const lines = pythonCode.split('\n');
    const processedLines: string[] = [];
    let indentLevel = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip closing braces
      if (trimmedLine === '}') {
        indentLevel = Math.max(0, indentLevel - 1);
        continue;
      }

      // Adjust indentation
      if (trimmedLine.endsWith(':')) {
        processedLines.push(' '.repeat(indentLevel * 4) + trimmedLine);
        indentLevel++;
      } else {
        processedLines.push(' '.repeat(indentLevel * 4) + trimmedLine);
      }

      // Handle else/elif/except/finally
      if (trimmedLine.startsWith('else') || trimmedLine.startsWith('elif') || 
          trimmedLine.startsWith('except') || trimmedLine.startsWith('finally')) {
        indentLevel = Math.max(0, indentLevel - 1);
        processedLines[processedLines.length - 1] = ' '.repeat(indentLevel * 4) + trimmedLine;
        if (trimmedLine.endsWith(':')) {
          indentLevel++;
        }
      }
    }

    pythonCode = processedLines.join('\n');

    return {
      success: true,
      output: pythonCode
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}