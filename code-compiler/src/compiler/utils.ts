// Utility functions for code transformation and formatting

export function handleIndentationBlocks(code: string, targetLanguage: 'python' | 'javascript'): string {
  if (targetLanguage === 'javascript') {
    return convertIndentationToBraces(code);
  } else {
    return convertBracesToIndentation(code);
  }
}

function convertIndentationToBraces(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  const indentStack: number[] = [0];
  let currentIndent = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      result.push('');
      continue;
    }
    
    const lineIndent = line.length - line.trimStart().length;
    
    // Handle indentation changes
    if (lineIndent > currentIndent) {
      indentStack.push(lineIndent);
      // Add opening brace to previous line if it ends with :
      if (result.length > 0) {
        const lastLine = result[result.length - 1];
        if (lastLine.trim().endsWith(':')) {
          result[result.length - 1] = lastLine.replace(/:$/, ' {');
        }
      }
    } else if (lineIndent < currentIndent) {
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > lineIndent) {
        indentStack.pop();
        result.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
      }
    }
    
    currentIndent = lineIndent;
    
    // Add the current line
    if (trimmedLine.endsWith(':')) {
      result.push(line.replace(/:$/, ' {'));
    } else {
      result.push(line);
    }
  }
  
  // Close remaining braces
  while (indentStack.length > 1) {
    indentStack.pop();
    result.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
  }
  
  return result.join('\n');
}

function convertBracesToIndentation(code: string): string {
  const lines = code.split('\n');
  const result: string[] = [];
  let indentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') {
      result.push('');
      continue;
    }
    
    if (line === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      continue;
    }
    
    const indent = '    '.repeat(indentLevel);
    
    if (line.includes('{')) {
      const cleanLine = line.replace(/\s*\{.*$/, ':');
      result.push(indent + cleanLine);
      indentLevel++;
    } else {
      result.push(indent + line);
    }
  }
  
  return result.join('\n');
}

export function formatCode(code: string, language: 'python' | 'javascript'): string {
  let formatted = code;
  
  // Remove excessive blank lines
  formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Remove trailing whitespace
  formatted = formatted.replace(/[ \t]+$/gm, '');
  
  // Ensure consistent spacing around operators
  if (language === 'javascript') {
    formatted = formatted.replace(/(\w)\+(\w)/g, '$1 + $2');
    formatted = formatted.replace(/(\w)-(\w)/g, '$1 - $2');
    formatted = formatted.replace(/(\w)\*(\w)/g, '$1 * $2');
    formatted = formatted.replace(/(\w)\/(\w)/g, '$1 / $2');
    formatted = formatted.replace(/(\w)=(\w)/g, '$1 = $2');
  }
  
  // Clean up empty lines at start and end
  formatted = formatted.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
  
  return formatted;
}

export function detectFunctionalPatterns(code: string): string[] {
  const patterns = [];
  
  // Check for higher-order functions
  if (code.includes('map') || code.includes('filter') || code.includes('reduce')) {
    patterns.push('Higher-order functions');
  }
  
  // Check for lambda/arrow functions
  if (code.includes('=>') || code.includes('lambda')) {
    patterns.push('Anonymous functions');
  }
  
  // Check for function composition
  if (code.includes('compose') || code.includes('pipe')) {
    patterns.push('Function composition');
  }
  
  // Check for immutable operations
  if (code.includes('...') || code.includes('Object.assign')) {
    patterns.push('Immutable operations');
  }
  
  return patterns;
}

export function addFunctionalImports(code: string, language: 'python' | 'javascript'): string {
  const patterns = detectFunctionalPatterns(code);
  
  if (language === 'python' && patterns.length > 0) {
    const imports = [];
    
    if (patterns.includes('Higher-order functions')) {
      imports.push('from functools import reduce');
    }
    
    if (patterns.includes('Function composition')) {
      imports.push('from functools import partial');
    }
    
    if (imports.length > 0) {
      return imports.join('\n') + '\n\n' + code;
    }
  }
  
  return code;
}