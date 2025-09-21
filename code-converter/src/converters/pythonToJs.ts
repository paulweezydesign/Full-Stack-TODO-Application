export interface ConversionResult {
  success: boolean;
  output: string;
  error?: string;
}

export function pythonToJavaScript(pythonCode: string): ConversionResult {
  try {
    let jsCode = pythonCode;

    // Convert print statements
    jsCode = jsCode.replace(/print\s*\((.*?)\)/g, 'console.log($1)');

    // Convert function definitions
    jsCode = jsCode.replace(/def\s+(\w+)\s*\((.*?)\)\s*:/g, 'const $1 = ($2) => {');

    // Convert class definitions
    jsCode = jsCode.replace(/class\s+(\w+)(?:\s*\((.*?)\))?\s*:/g, (match, className, parent) => {
      if (parent) {
        return `class ${className} extends ${parent} {`;
      }
      return `class ${className} {`;
    });

    // Convert self to this
    jsCode = jsCode.replace(/\bself\b/g, 'this');

    // Convert True/False/None
    jsCode = jsCode.replace(/\bTrue\b/g, 'true');
    jsCode = jsCode.replace(/\bFalse\b/g, 'false');
    jsCode = jsCode.replace(/\bNone\b/g, 'null');

    // Convert elif to else if
    jsCode = jsCode.replace(/\belif\b/g, 'else if');

    // Convert dictionary/list comprehensions (basic)
    jsCode = jsCode.replace(/\[(.*?)\s+for\s+(\w+)\s+in\s+(.*?)\]/g, '$3.map($2 => $1)');

    // Convert range() to Array.from()
    jsCode = jsCode.replace(/range\s*\((\d+)\)/g, 'Array.from({length: $1}, (_, i) => i)');
    jsCode = jsCode.replace(/range\s*\((\d+),\s*(\d+)\)/g, 'Array.from({length: $2 - $1}, (_, i) => i + $1)');

    // Convert string formatting
    jsCode = jsCode.replace(/f["'](.*?)["']/g, (match, content) => {
      const replaced = content.replace(/\{(\w+)\}/g, '${$1}');
      return '`' + replaced + '`';
    });

    // Convert len() to .length
    jsCode = jsCode.replace(/len\s*\((.*?)\)/g, '$1.length');

    // Convert list methods
    jsCode = jsCode.replace(/\.append\s*\((.*?)\)/g, '.push($1)');
    jsCode = jsCode.replace(/\.extend\s*\((.*?)\)/g, '.push(...$1)');

    // Convert dictionary access
    jsCode = jsCode.replace(/\.get\s*\(["'](\w+)["']\s*(?:,\s*(.*?))?\)/g, (match, key, defaultVal) => {
      if (defaultVal) {
        return `['${key}'] ?? ${defaultVal}`;
      }
      return `['${key}']`;
    });

    // Convert for loops
    jsCode = jsCode.replace(/for\s+(\w+)\s+in\s+(.*?):/g, 'for (const $1 of $2) {');

    // Convert while loops
    jsCode = jsCode.replace(/while\s+(.*?):/g, 'while ($1) {');

    // Convert if statements
    jsCode = jsCode.replace(/if\s+(.*?):/g, 'if ($1) {');

    // Convert try/except to try/catch
    jsCode = jsCode.replace(/except\s*(\w*)\s*(?:as\s+(\w+))?\s*:/g, (match, exception, alias) => {
      if (alias) {
        return `catch (${alias}) {`;
      }
      return 'catch (error) {';
    });

    // Convert import statements
    jsCode = jsCode.replace(/from\s+(\S+)\s+import\s+(.*)/g, 'import { $2 } from \'$1\';');
    jsCode = jsCode.replace(/import\s+(\S+)$/gm, 'import \'$1\';');

    // Convert lambda functions
    jsCode = jsCode.replace(/lambda\s+(.*?):\s*(.*?)(?=[,\)])/g, '($1) => $2');

    // Add closing braces for blocks (simplified)
    const lines = jsCode.split('\n');
    const processedLines: string[] = [];
    let indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const currentIndent = line.search(/\S|$/);
      
      // Close blocks when indentation decreases
      while (indentStack.length > 1 && currentIndent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        const closingIndent = ' '.repeat(indentStack[indentStack.length - 1]);
        processedLines.push(closingIndent + '}');
      }

      processedLines.push(line);

      // Track opening blocks
      if (line.includes('{')) {
        indentStack.push(currentIndent + 2);
      }
    }

    // Close remaining blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      processedLines.push('}');
    }

    jsCode = processedLines.join('\n');

    return {
      success: true,
      output: jsCode
    };
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}