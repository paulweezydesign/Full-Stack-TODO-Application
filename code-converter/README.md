# Code Converter - Python ⇄ JavaScript

A modern web application that converts code between Python and JavaScript with a beautiful React-based interface.

## Features

- **Bidirectional Conversion**: Convert Python to JavaScript or JavaScript to Python
- **Live Code Editor**: Monaco Editor with syntax highlighting for both languages
- **Modern UI**: Dark theme with split-pane interface
- **Sample Code**: Pre-loaded examples to test the converter
- **Real-time Conversion**: Instant code transformation
- **Error Handling**: Clear error messages for conversion issues

## Supported Conversions

### Python to JavaScript
- Functions and classes
- Control structures (if, elif, else, for, while)
- List comprehensions → Array methods
- String formatting (f-strings → template literals)
- Built-in functions (print → console.log, len → .length)
- Boolean values (True/False → true/false)
- None → null
- Exception handling (try/except → try/catch)

### JavaScript to Python
- Arrow functions and function declarations
- Classes and methods
- Control structures
- Template literals → f-strings
- Array methods → List operations
- console.log → print
- Boolean and null conversions
- Promise handling basics

## Getting Started

### Prerequisites
- Node.js 14+ and npm

### Installation

1. Clone the repository:
```bash
cd code-converter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Select conversion direction (Python → JavaScript or JavaScript → Python)
2. Enter or paste your code in the left editor
3. Click "Convert" to see the transformed code
4. Use "Load Sample" to see example conversions
5. Use "Swap" to reverse the conversion direction
6. Click "Clear" to reset both editors

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Limitations

This converter handles basic to intermediate syntax transformations. Complex code patterns may require manual adjustments:

- Advanced Python features (decorators, metaclasses, async/await)
- Complex type annotations
- Library-specific code
- Some edge cases in control flow

## Technologies Used

- React with TypeScript
- Monaco Editor (VS Code's editor)
- react-split-pane-next for resizable panes
- Custom AST-like transformation logic

## License

MIT