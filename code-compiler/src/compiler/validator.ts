// Code validation and error handling utilities

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  type: 'syntax' | 'semantic' | 'runtime';
}

export interface ValidationWarning {
  line?: number;
  column?: number;
  message: string;
  type: 'style' | 'performance' | 'compatibility';
}

export function validatePythonCode(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const lines = code.split('\n');
  
  // Check for common Python syntax issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for missing colons
    if (/^(def|if|elif|else|for|while|try|except|finally|with|class)\s/.test(trimmed) && !trimmed.endsWith(':')) {
      errors.push({
        line: lineNum,
        message: `Missing colon at end of ${trimmed.split(' ')[0]} statement`,
        type: 'syntax'
      });
    }
    
    // Check for inconsistent indentation
    if (line.length > 0 && line !== line.trimStart()) {
      const spaces = line.length - line.trimStart().length;
      if (spaces % 4 !== 0) {
        warnings.push({
          line: lineNum,
          message: 'Indentation should be a multiple of 4 spaces',
          type: 'style'
        });
      }
    }
    
    // Check for undefined variables (basic check)
    const varMatches = trimmed.match(/\b(\w+)\s*=/);
    if (varMatches && /^[A-Z]/.test(varMatches[1])) {
      warnings.push({
        line: lineNum,
        message: 'Variable names should start with lowercase letter',
        type: 'style'
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateJavaScriptCode(code: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  const lines = code.split('\n');
  
  // Check for common JavaScript syntax issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Check for missing semicolons (if using semicolon style)
    if (trimmed.length > 0 && 
        !trimmed.endsWith(';') && 
        !trimmed.endsWith('{') && 
        !trimmed.endsWith('}') && 
        !/^(if|else|for|while|function|const|let|var)/.test(trimmed) &&
        !trimmed.startsWith('//') &&
        !trimmed.includes('=>')) {
      warnings.push({
        line: lineNum,
        message: 'Consider adding semicolon at end of statement',
        type: 'style'
      });
    }
    
    // Check for var usage (prefer const/let)
    if (trimmed.startsWith('var ')) {
      warnings.push({
        line: lineNum,
        message: 'Consider using const or let instead of var',
        type: 'style'
      });
    }
    
    // Check for == instead of ===
    if (trimmed.includes('==') && !trimmed.includes('===')) {
      warnings.push({
        line: lineNum,
        message: 'Consider using === instead of == for strict equality',
        type: 'style'
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function formatValidationMessage(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return '';
  }
  
  let message = '';
  
  if (result.errors.length > 0) {
    message += 'Errors:\n';
    result.errors.forEach(error => {
      message += `Line ${error.line || '?'}: ${error.message}\n`;
    });
  }
  
  if (result.warnings.length > 0) {
    if (message) message += '\n';
    message += 'Warnings:\n';
    result.warnings.forEach(warning => {
      message += `Line ${warning.line || '?'}: ${warning.message}\n`;
    });
  }
  
  return message;
}