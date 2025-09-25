/* eslint-disable no-restricted-globals */
let pyodideInstance = null;
let packagesInstalled = false;

async function ensurePyodideAndPackages() {
  if (!pyodideInstance) {
    importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
    // loadPyodide is provided by the imported script
    // @ts-ignore
    pyodideInstance = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/' });
  }
  // Ensure micropip and required packages are installed once
  if (!packagesInstalled) {
    await pyodideInstance.loadPackage('micropip');
    await pyodideInstance.runPythonAsync(`
import micropip
await micropip.install('transcrypt')
await micropip.install('js2py')
`);
    packagesInstalled = true;
  }
  return pyodideInstance;
}

self.onmessage = async (event) => {
  const data = event.data || {};
  try {
    if (data.type === 'init') {
      await ensurePyodideAndPackages();
      self.postMessage({ type: 'ready' });
      return;
    }

    if (data.type === 'convert') {
      const { direction, code } = data;
      const pyodide = await ensurePyodideAndPackages();

      if (direction === 'py2js') {
        // Write Python source to the in-memory FS
        pyodide.FS.writeFile('input.py', code);
        const jsCode = await pyodide.runPythonAsync(`
from transcrypt.__main__ import main as transcrypt_main
import sys, os

# Invoke Transcrypt to transpile input.py into __target__/input.js
try:
    sys.argv = ['transcrypt', 'input.py']
    transcrypt_main()
except SystemExit:
    pass

open('__target__/input.js', 'r', encoding='utf-8').read()
        `);
        self.postMessage({ type: 'result', output: jsCode });
        return;
      }

      if (direction === 'js2py') {
        pyodide.FS.writeFile('input.js', code);
        const pyCode = await pyodide.runPythonAsync(`
import js2py
js2py.translate_js(open('input.js', 'r', encoding='utf-8').read())
        `);
        self.postMessage({ type: 'result', output: pyCode });
        return;
      }

      throw new Error('Unknown conversion direction');
    }
  } catch (err) {
    const message = (err && err.message) ? err.message : String(err);
    self.postMessage({ type: 'error', error: message });
  }
};

