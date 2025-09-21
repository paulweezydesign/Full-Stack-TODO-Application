import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeEditor = () => {
    const [code, setCode] = useState(`# Example Python code
def greet(name):
    print(f"Hello, {name}!")

for i in range(3):
    greet(f"User {i}")

result = [x * 2 for x in range(5)]
print(result)`);

    const [language, setLanguage] = useState('python');
    const [convertedCode, setConvertedCode] = useState('');
    const [isConverting, setIsConverting] = useState(false);

    const handleConvert = async () => {
        setIsConverting(true);
        try {
            const targetLanguage = language === 'python' ? 'javascript' : 'python';
            const response = await fetch('http://localhost:5000/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    fromLanguage: language,
                    toLanguage: targetLanguage
                })
            });

            const data = await response.json();

            if (response.ok) {
                setConvertedCode(data.convertedCode);
            } else {
                setConvertedCode(`Error: ${data.error}`);
            }
        } catch (error) {
            setConvertedCode(`Error: ${error.message}`);
        } finally {
            setIsConverting(false);
        }
    };

    const handleLanguageChange = (newLanguage) => {
        setLanguage(newLanguage);
        setConvertedCode(''); // Clear converted code when switching languages
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            // You could add a toast notification here
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    Code Transpiler
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                    Convert between Python and JavaScript with modern functional syntax
                </p>
            </div>

            {/* Language Selector */}
            <div className="flex justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-md">
                    <button
                        onClick={() => handleLanguageChange('python')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            language === 'python'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                        }`}
                    >
                        Python
                    </button>
                    <button
                        onClick={() => handleLanguageChange('javascript')}
                        className={`px-4 py-2 rounded-md font-medium transition-colors ${
                            language === 'javascript'
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                        }`}
                    >
                        JavaScript
                    </button>
                </div>
            </div>

            {/* Code Editor and Result */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Editor */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {language === 'python' ? 'Python Code' : 'JavaScript Code'}
                        </h3>
                        <button
                            onClick={() => copyToClipboard(code)}
                            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-green-400 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={`Enter your ${language} code here...`}
                    />
                </div>

                {/* Output Display */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            {language === 'python' ? 'JavaScript Output' : 'Python Output'}
                        </h3>
                        <div className="flex space-x-2">
                            <button
                                onClick={handleConvert}
                                disabled={isConverting}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
                            >
                                {isConverting ? 'Converting...' : 'Convert'}
                            </button>
                            {convertedCode && (
                                <button
                                    onClick={() => copyToClipboard(convertedCode)}
                                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Copy
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                        {convertedCode ? (
                            <SyntaxHighlighter
                                language={language === 'python' ? 'javascript' : 'python'}
                                style={oneDark}
                                customStyle={{
                                    margin: 0,
                                    padding: '1rem',
                                    minHeight: '16rem'
                                }}
                                showLineNumbers={true}
                            >
                                {convertedCode}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="p-4 text-gray-500 text-center">
                                Click "Convert" to see the transpiled code
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    How to use:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Select your source language (Python or JavaScript)</li>
                    <li>• Enter your code in the left editor</li>
                    <li>• Click "Convert" to see the transpiled version</li>
                    <li>• Use the copy buttons to copy code to clipboard</li>
                </ul>
            </div>
        </div>
    );
};

export default CodeEditor;