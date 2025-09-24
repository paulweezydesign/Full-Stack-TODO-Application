import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Editor from '@monaco-editor/react';
import { translatePythonToJavaScript, translateJavaScriptToPython } from './compiler/translator';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  color: white;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin: 10px 0 0 0;
  opacity: 0.9;
`;

const CompilerContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ControlPanel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
`;

const LanguageSelector = styled.select`
  padding: 10px 15px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #764ba2;
  }
`;

const CompileButton = styled.button`
  padding: 12px 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ClearButton = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
  }
`;

const ExampleButton = styled.button`
  padding: 8px 16px;
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }
`;

const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 600px;
`;

const EditorPanel = styled.div`
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e9ecef;
  
  &:last-child {
    border-right: none;
  }
`;

const EditorHeader = styled.div`
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LanguageBadge = styled.span<{ language: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => props.language === 'python' ? '#3776ab' : '#f7df1e'};
  color: ${props => props.language === 'python' ? 'white' : 'black'};
`;

const ErrorMessage = styled.div`
  padding: 15px 20px;
  background: #f8d7da;
  color: #721c24;
  border-bottom: 1px solid #f5c6cb;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  white-space: pre-wrap;
`;

type Language = 'python' | 'javascript';

const App: React.FC = () => {
  const [sourceLanguage, setSourceLanguage] = useState<Language>('python');
  const [sourceCode, setSourceCode] = useState(`# Python example with functional syntax
def add(x, y):
    return x + y

def multiply(x, y):
    return x * y

# Using map and filter
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

# Function composition
def compose(f, g):
    return lambda x: f(g(x))

double = lambda x: x * 2
increment = lambda x: x + 1
double_then_increment = compose(increment, double)

result = double_then_increment(5)
print(f"Result: {result}")
`);
  const [targetCode, setTargetCode] = useState('');
  const [error, setError] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  const targetLanguage: Language = sourceLanguage === 'python' ? 'javascript' : 'python';

  const handleCompile = useCallback(async () => {
    if (!sourceCode.trim()) return;
    
    setIsCompiling(true);
    setError('');
    
    try {
      let result: string;
      if (sourceLanguage === 'python') {
        result = await translatePythonToJavaScript(sourceCode);
      } else {
        result = await translateJavaScriptToPython(sourceCode);
      }
      setTargetCode(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during compilation');
      setTargetCode('');
    } finally {
      setIsCompiling(false);
    }
  }, [sourceCode, sourceLanguage]);

  const handleLanguageSwitch = () => {
    const newSourceLanguage: Language = sourceLanguage === 'python' ? 'javascript' : 'python';
    setSourceLanguage(newSourceLanguage);
    
    // Swap the code if target code exists
    if (targetCode.trim()) {
      setSourceCode(targetCode);
      setTargetCode(sourceCode);
    } else {
      loadExampleCode(newSourceLanguage);
    }
    setError('');
  };

  const loadExampleCode = (language: Language) => {
    if (language === 'javascript') {
      setSourceCode(`// JavaScript example with functional syntax
const add = (x, y) => x + y;
const multiply = (x, y) => x * y;

// Using map and filter
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(x => x ** 2);
const evens = numbers.filter(x => x % 2 === 0);

// Function composition
const compose = (f, g) => x => f(g(x));

const double = x => x * 2;
const increment = x => x + 1;
const doubleThenIncrement = compose(increment, double);

const result = doubleThenIncrement(5);
console.log(\`Result: \${result}\`);
`);
    } else {
      setSourceCode(`# Python example with functional syntax
def add(x, y):
    return x + y

def multiply(x, y):
    return x * y

# Using map and filter
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
evens = list(filter(lambda x: x % 2 == 0, numbers))

# Function composition
def compose(f, g):
    return lambda x: f(g(x))

double = lambda x: x * 2
increment = lambda x: x + 1
double_then_increment = compose(increment, double)

result = double_then_increment(5)
print(f"Result: {result}")
`);
    }
  };

  const handleClear = () => {
    setSourceCode('');
    setTargetCode('');
    setError('');
  };

  const handleLoadExample = () => {
    loadExampleCode(sourceLanguage);
    setTargetCode('');
    setError('');
  };

  return (
    <AppContainer>
      <Header>
        <Title>🚀 Code Compiler</Title>
        <Subtitle>Translate between Python and JavaScript with modern functional syntax</Subtitle>
      </Header>
      
      <CompilerContainer>
        <ControlPanel>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <ExampleButton onClick={handleLoadExample}>
              📝 Load Example
            </ExampleButton>
            <ClearButton onClick={handleClear}>
              🗑️ Clear
            </ClearButton>
          </div>
          
          <LanguageSelector 
            value={`${sourceLanguage}-to-${targetLanguage}`}
            onChange={handleLanguageSwitch}
          >
            <option value="python-to-javascript">Python → JavaScript</option>
            <option value="javascript-to-python">JavaScript → Python</option>
          </LanguageSelector>
          
          <CompileButton 
            onClick={handleCompile}
            disabled={isCompiling || !sourceCode.trim()}
          >
            {isCompiling ? '🔄 Compiling...' : '🔥 Compile'}
          </CompileButton>
        </ControlPanel>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <EditorContainer>
          <EditorPanel>
            <EditorHeader>
              <span>Source Code</span>
              <LanguageBadge language={sourceLanguage}>
                {sourceLanguage.toUpperCase()}
              </LanguageBadge>
            </EditorHeader>
            <Editor
              height="100%"
              language={sourceLanguage}
              value={sourceCode}
              onChange={(value) => setSourceCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </EditorPanel>

          <EditorPanel>
            <EditorHeader>
              <span>Compiled Code</span>
              <LanguageBadge language={targetLanguage}>
                {targetLanguage.toUpperCase()}
              </LanguageBadge>
            </EditorHeader>
            <Editor
              height="100%"
              language={targetLanguage}
              value={targetCode}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: true,
              }}
            />
          </EditorPanel>
        </EditorContainer>
      </CompilerContainer>
    </AppContainer>
  );
};

export default App;