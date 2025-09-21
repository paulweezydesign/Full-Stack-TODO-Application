## Python ↔ JavaScript Converter (React + Vite)

A browser-based code converter with a React UI that transpiles between Python and JavaScript:

- Python → JavaScript uses Transcrypt running in Pyodide
- JavaScript → Python uses Js2Py running in Pyodide

No server required; everything runs locally in your browser via Web Worker.

### Getting Started

```bash
npm install
npm run dev
```

Then open the app and wait for Pyodide and packages to load (first run may take ~20–40s). Enter code on the left, choose direction, and press Convert.

### Notes

- Transcrypt targets modern JS and works best with idiomatic Python (not all dynamic features are supported).
- Js2Py translation is heuristic and may not produce idiomatic Python for advanced JS patterns.
- If the first load is slow, subsequent loads should be faster due to browser caching.
