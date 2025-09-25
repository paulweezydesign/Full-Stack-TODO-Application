# Code Transpiler

A modern web application that converts code between Python and JavaScript using functional programming syntax.

## Features

- **Bidirectional Conversion**: Convert Python code to JavaScript and JavaScript code to Python
- **Modern Syntax Support**: Handles modern functional programming constructs
- **Real-time Conversion**: Instant code transpilation with syntax highlighting
- **Copy to Clipboard**: Easy copying of both input and converted code
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern dark theme with syntax highlighting

## Supported Conversions

### Python to JavaScript
- Function definitions (`def` → `function`)
- Print statements (`print()` → `console.log()`)
- Variable assignments
- If statements
- For loops with range
- Return statements
- Function calls
- List comprehensions (basic support)

### JavaScript to Python
- Function declarations (`function` → `def`)
- Console.log statements (`console.log()` → `print()`)
- Variable declarations (`let/const/var` → assignments)
- If statements
- For loops
- Return statements
- Function calls

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd code-transpiler
   ```

2. **Install dependencies for both client and server**
   ```bash
   # Install client dependencies
   cd Client
   npm install

   # Install server dependencies
   cd ../Server
   npm install
   ```

3. **Start the servers**

   **Terminal 1 - Server:**
   ```bash
   cd Server
   node index.js
   ```

   **Terminal 2 - Client:**
   ```bash
   cd Client
   npm run dev
   ```

4. **Open your browser**

   Navigate to `http://localhost:5173` to access the application.

## Usage

1. **Select Language**: Choose between Python and JavaScript using the language selector
2. **Enter Code**: Type or paste your code in the left editor panel
3. **Convert**: Click the "Convert" button to see the transpiled code
4. **Copy**: Use the copy buttons to copy code to your clipboard

## Example Usage

### Python to JavaScript Example

**Input (Python):**
```python
def greet(name):
    print(f"Hello, {name}!")

for i in range(3):
    greet(f"User {i}")

result = [x * 2 for x in range(5)]
print(result)
```

**Output (JavaScript):**
```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
}

for (let i = 0; i < 3; i++) {
    greet(`User ${i}`);
}

let result = [x * 2 for x in range(5)];
console.log(result);
```

### JavaScript to Python Example

**Input (JavaScript):**
```javascript
function calculateSum(numbers) {
    return numbers.reduce((acc, num) => acc + num, 0);
}

const result = calculateSum([1, 2, 3, 4, 5]);
console.log(`Sum: ${result}`);
```

**Output (Python):**
```python
def calculateSum(numbers):
    return numbers.reduce((acc, num) => acc + num, 0);

result = calculateSum([1, 2, 3, 4, 5]);
print(`Sum: ${result}`);
```

## API Endpoints

### POST /convert
Converts code between Python and JavaScript.

**Request Body:**
```json
{
  "code": "your code here",
  "fromLanguage": "python|javascript",
  "toLanguage": "python|javascript"
}
```

**Response:**
```json
{
  "convertedCode": "converted code here",
  "originalCode": "original code here",
  "fromLanguage": "python|javascript",
  "toLanguage": "python|javascript"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "message": "Code transpiler server is running"
}
```

## Technologies Used

- **Frontend**: React, Tailwind CSS, React Syntax Highlighter
- **Backend**: Node.js, Express.js
- **Styling**: Tailwind CSS with dark mode support
- **Development**: Vite (React build tool)

## Limitations

- Basic transpilation only (not a full compiler)
- Limited support for complex language features
- No error handling for invalid syntax
- Simple regex-based conversion (not semantic analysis)

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License