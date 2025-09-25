const express = require('express')
const cors = require('cors')
const app = express();

app.use(express.json())
app.use(cors()) //cross-origin resource

// Simple transpilation functions
function pythonToJavaScript(pythonCode) {
    let jsCode = pythonCode;

    // Basic function conversion
    jsCode = jsCode.replace(/def\s+(\w+)\s*\(([^)]*)\):/g, 'function $1($2) {');

    // Print statement to console.log
    jsCode = jsCode.replace(/print\s*\(([^)]+)\)/g, 'console.log($1)');

    // Variable assignments
    jsCode = jsCode.replace(/(\w+)\s*=\s*(.+)/g, 'let $1 = $2;');

    // If statements
    jsCode = jsCode.replace(/if\s+(.+):/g, 'if ($1) {');

    // For loops
    jsCode = jsCode.replace(/for\s+(\w+)\s+in\s+range\s*\(([^)]+)\):/g, 'for (let $1 = 0; $1 < $2; $1++) {');

    // Return statements
    jsCode = jsCode.replace(/return\s+(.+)/g, 'return $1;');

    // Function calls
    jsCode = jsCode.replace(/(\w+)\s*\(([^)]*)\)/g, '$1($2)');

    // Add closing braces and semicolons where needed
    jsCode = jsCode.replace(/(\s*\n)(?!\s*[\}\]\)])/g, '$1}');
    jsCode = jsCode.replace(/([^;}])\n/g, '$1;\n');

    return jsCode;
}

function javascriptToPython(jsCode) {
    let pythonCode = jsCode;

    // Function declarations
    pythonCode = pythonCode.replace(/function\s+(\w+)\s*\(([^)]*)\)\s*{/g, 'def $1($2):');

    // Console.log to print
    pythonCode = pythonCode.replace(/console\.log\s*\(([^)]+)\)/g, 'print($1)');

    // Let/const declarations to assignments
    pythonCode = pythonCode.replace(/(?:let|const|var)\s+(\w+)\s*=\s*(.+);/g, '$1 = $2');

    // If statements
    pythonCode = pythonCode.replace(/if\s*\(([^)]+)\)\s*{/g, 'if $1:');

    // For loops
    pythonCode = pythonCode.replace(/for\s*\(\s*let\s+(\w+)\s*=\s*(\d+)\s*;\s*\w+\s*<\s*([^;]+)\s*;\s*\w+\+\+\s*\)\s*{/g, 'for $1 in range($2, $3):');

    // Return statements
    pythonCode = pythonCode.replace(/return\s+([^;]+);/g, 'return $1');

    // Function calls
    pythonCode = pythonCode.replace(/(\w+)\s*\(([^)]*)\)/g, '$1($2)');

    // Remove semicolons and adjust indentation
    pythonCode = pythonCode.replace(/;/g, '');
    pythonCode = pythonCode.replace(/}\s*$/g, '');

    return pythonCode;
}

// API endpoint for code conversion
app.post('/convert', (req, res) => {
    try {
        const { code, fromLanguage, toLanguage } = req.body;

        if (!code || !fromLanguage || !toLanguage) {
            return res.status(400).json({ error: 'Missing required fields: code, fromLanguage, toLanguage' });
        }

        let convertedCode;

        if (fromLanguage === 'python' && toLanguage === 'javascript') {
            convertedCode = pythonToJavaScript(code);
        } else if (fromLanguage === 'javascript' && toLanguage === 'python') {
            convertedCode = javascriptToPython(code);
        } else {
            return res.status(400).json({ error: 'Unsupported language conversion' });
        }

        res.json({
            convertedCode,
            originalCode: code,
            fromLanguage,
            toLanguage
        });
    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({ error: 'Failed to convert code' });
    }
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Code transpiler server is running' });
})

app.listen(5000, () => {
    console.log('Code transpiler server started on port 5000');
})

