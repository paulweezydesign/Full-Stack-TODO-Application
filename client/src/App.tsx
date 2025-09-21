import { useEffect, useMemo, useState } from 'react'
import './App.css'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { convertCode, initPyodide } from './converter'

function App() {
  const [direction, setDirection] = useState<'py2js' | 'js2py'>('py2js')
  const [source, setSource] = useState(`# Example: Python -> JavaScript\n\n# Define a function\ndef add(a, b):\n    return a + b\n\nprint(add(2, 3))`)
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initPyodide().then(() => setReady(true)).catch((e) => setError(e.message))
  }, [])

  const leftExtensions = useMemo(() => (direction === 'py2js' ? [python()] : [javascript()]), [direction])
  const rightExtensions = useMemo(() => (direction === 'py2js' ? [javascript()] : [python()]), [direction])

  const handleConvert = async () => {
    setError(null)
    setLoading(true)
    try {
      const output = await convertCode(direction, source)
      setResult(output)
    } catch (e: any) {
      setError(e?.message || 'Conversion failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: 8 }}>Python ↔ JavaScript Converter</h1>
      <p style={{ color: '#555', marginTop: 0 }}>Transpile Python↔JS with modern functional syntax using Pyodide (Transcrypt / Js2Py).</p>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            name="direction"
            value="py2js"
            checked={direction === 'py2js'}
            onChange={() => setDirection('py2js')}
          />
          Python → JavaScript
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="radio"
            name="direction"
            value="js2py"
            checked={direction === 'js2py'}
            onChange={() => setDirection('js2py')}
          />
          JavaScript → Python
        </label>

        <button onClick={handleConvert} disabled={!ready || loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Converting…' : 'Convert'}
        </button>
      </div>

      {!ready && <div style={{ marginBottom: 8 }}>Loading Pyodide & packages… This may take ~20–40s on first load.</div>}
      {error && (
        <div style={{ background: '#fee', color: '#900', padding: 8, border: '1px solid #f99', marginBottom: 8 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{direction === 'py2js' ? 'Python' : 'JavaScript'}</div>
          <CodeMirror value={source} height="420px" extensions={leftExtensions} onChange={(v) => setSource(v)} />
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{direction === 'py2js' ? 'JavaScript' : 'Python'}</div>
          <CodeMirror value={result} height="420px" extensions={rightExtensions} readOnly />
        </div>
      </div>
    </div>
  )
}

export default App
