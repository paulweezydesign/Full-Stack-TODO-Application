import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import SplitPane from 'react-split-pane-next';
import { pythonToJavaScript } from '../converters/pythonToJs';
import { javaScriptToPython } from '../converters/jsToPython';
import './CodeConverter.css';

type ConversionDirection = 'py-to-js' | 'js-to-py';

const CodeConverter: React.FC = () => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [direction, setDirection] = useState<ConversionDirection>('py-to-js');
  const [error, setError] = useState<string | null>(null);

  const handleConvert = () => {
    setError(null);
    
    if (direction === 'py-to-js') {
      const result = pythonToJavaScript(inputCode);
      if (result.success) {
        setOutputCode(result.output);
      } else {
        setError(result.error || 'Conversion failed');
      }
    } else {
      const result = javaScriptToPython(inputCode);
      if (result.success) {
        setOutputCode(result.output);
      } else {
        setError(result.error || 'Conversion failed');
      }
    }
  };

  const handleSwapDirection = () => {
    setDirection(direction === 'py-to-js' ? 'js-to-py' : 'py-to-js');
    setInputCode(outputCode);
    setOutputCode(inputCode);
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    setError(null);
  };

  const getInputLanguage = () => {
    return direction === 'py-to-js' ? 'python' : 'javascript';
  };

  const getOutputLanguage = () => {
    return direction === 'py-to-js' ? 'javascript' : 'python';
  };

  const sampleCode = {
    python: `# Sample Python code
def greet(name):
    return f"Hello, {name}!"

class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
    
    def introduce(self):
        print(f"I'm {self.name}, {self.age} years old")

# List comprehension
numbers = [x * 2 for x in range(10)]

# Using the code
person = Person("Alice", 30)
person.introduce()

for num in numbers:
    if num > 10:
        print(num)`,
    javascript: `// Sample JavaScript code
const greet = (name) => {
    return \`Hello, \${name}!\`;
};

class Person {
    constructor(name, age) {
        this.name = name;
        this.age = age;
    }
    
    introduce() {
        console.log(\`I'm \${this.name}, \${this.age} years old\`);
    }
}

// Array mapping
const numbers = Array.from({length: 10}, (_, i) => i * 2);

// Using the code
const person = new Person("Alice", 30);
person.introduce();

for (const num of numbers) {
    if (num > 10) {
        console.log(num);
    }
}`
  };

  const loadSampleCode = () => {
    const sample = direction === 'py-to-js' ? sampleCode.python : sampleCode.javascript;
    setInputCode(sample);
    setOutputCode('');
    setError(null);
  };

  return (
    <div className="code-converter">
      <header className="converter-header">
        <h1>Code Converter</h1>
        <div className="controls">
          <button className="sample-btn" onClick={loadSampleCode}>
            Load Sample
          </button>
          <select 
            value={direction} 
            onChange={(e) => setDirection(e.target.value as ConversionDirection)}
            className="direction-select"
          >
            <option value="py-to-js">Python → JavaScript</option>
            <option value="js-to-py">JavaScript → Python</option>
          </select>
          <button className="swap-btn" onClick={handleSwapDirection}>
            ⇄ Swap
          </button>
          <button className="convert-btn" onClick={handleConvert}>
            Convert
          </button>
          <button className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>
      </header>

      {error && (
        <div className="error-message">
          <span>Error: {error}</span>
        </div>
      )}

      <div className="editor-container">
        <SplitPane split="vertical" defaultSize="50%">
          <div className="editor-pane">
            <div className="editor-header">
              <span className="language-label">{getInputLanguage().toUpperCase()}</span>
              <span className="pane-label">Input Code</span>
            </div>
            <Editor
              height="calc(100% - 40px)"
              language={getInputLanguage()}
              value={inputCode}
              onChange={(value) => setInputCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <div className="editor-pane">
            <div className="editor-header">
              <span className="language-label">{getOutputLanguage().toUpperCase()}</span>
              <span className="pane-label">Output Code</span>
            </div>
            <Editor
              height="calc(100% - 40px)"
              language={getOutputLanguage()}
              value={outputCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: true,
              }}
            />
          </div>
        </SplitPane>
      </div>

      <footer className="converter-footer">
        <p>
          Note: This converter handles basic syntax transformations. Complex code may require manual adjustments.
        </p>
      </footer>
    </div>
  );
};

export default CodeConverter;