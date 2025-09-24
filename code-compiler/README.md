# 🚀 Code Compiler

A modern web application that translates code between Python and JavaScript with functional programming syntax support.

## Features

- **Bidirectional Translation**: Convert Python to JavaScript and vice versa
- **Functional Programming Support**: Modern functional syntax transformations
- **Real-time Validation**: Input validation with error reporting
- **Monaco Editor**: Professional code editing experience with syntax highlighting
- **Modern UI**: Beautiful, responsive design with gradient backgrounds
- **Pattern Matching**: Advanced regex-based pattern recognition and transformation

## Supported Transformations

### Python → JavaScript
- Function definitions (`def` → `const func = () => {}`)
- Lambda functions (`lambda` → arrow functions)
- List operations (`map`, `filter` → array methods)
- Print statements → `console.log`
- F-strings → template literals
- Boolean values (`True`/`False` → `true`/`false`)

### JavaScript → Python
- Arrow functions → `def` functions
- Template literals → f-strings
- Array methods → list functions
- `console.log` → `print`
- Boolean values (`true`/`false` → `True`/`False`)
- Variable declarations → Python assignments

## Functional Programming Features

- Higher-order function transformations
- Function composition patterns
- Immutable operation suggestions
- Modern syntax recommendations

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

1. **Select Translation Direction**: Choose between Python→JavaScript or JavaScript→Python
2. **Enter Code**: Type or paste your code in the left editor
3. **Compile**: Click the "🔥 Compile" button to translate
4. **View Results**: See the translated code in the right editor

## Example Translations

### Python to JavaScript

**Input (Python):**
```python
def add(x, y):
    return x + y

numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
print(f"Result: {squared}")
```

**Output (JavaScript):**
```javascript
const add = (x, y) => {
    return x + y;
}

const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map((x) => x ** 2);
console.log(`Result: ${squared}`);
```

### JavaScript to Python

**Input (JavaScript):**
```javascript
const multiply = (a, b) => a * b;
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2);
console.log(`Doubled: ${doubled}`);
```

**Output (Python):**
```python
multiply = lambda a, b: a * b
numbers = [1, 2, 3, 4, 5]
doubled = list(map(lambda x: x * 2, numbers))
print(f"Doubled: {doubled}")
```

## Architecture

- **React + TypeScript**: Modern frontend framework
- **Monaco Editor**: Professional code editing
- **Styled Components**: CSS-in-JS styling
- **Pattern Matching**: Regex-based transformations
- **AST Support**: Future-ready for advanced parsing

## Development

### Project Structure
```
src/
├── App.tsx                 # Main application component
├── compiler/
│   ├── translator.ts       # Core translation logic
│   ├── patterns.ts         # Pattern matching rules
│   ├── validator.ts        # Code validation
│   └── utils.ts           # Utility functions
└── index.tsx              # Application entry point
```

### Adding New Patterns

1. Add patterns to `src/compiler/patterns.ts`
2. Update the relevant pattern arrays
3. Test with example code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new patterns
5. Submit a pull request

## Future Enhancements

- **AST-based Parsing**: More accurate code analysis
- **More Languages**: Support for additional programming languages
- **Advanced Optimizations**: Code optimization suggestions
- **Export Options**: Save translated code to files
- **Syntax Themes**: Multiple editor themes

## License

MIT License - feel free to use this project for learning and development!

## Technologies Used

- React 18
- TypeScript
- Monaco Editor
- Styled Components
- Babel (for future AST support)

---

Built with ❤️ for developers who love functional programming!