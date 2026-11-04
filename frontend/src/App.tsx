import { useCallback, useMemo, useState } from 'react'
import './App.css'
import Editor from '@monaco-editor/react'
import ky, { HTTPError } from 'ky'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''

type Language = 'python' | 'javascript'

type ConvertResponse = {
	output: string
}

const samples: Record<Language, string> = {
	python: `def add(a, b):\n    return a + b\n\nprint(add(2, 3))\n`,
	javascript: `export function add(a, b) {\n  return a + b;\n}\nconsole.log(add(2, 3));\n`,
}

function App() {
	const [fromLang, setFromLang] = useState<Language>('python')
	const [toLang, setToLang] = useState<Language>('javascript')
	const [input, setInput] = useState<string>(samples.python)
	const [output, setOutput] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const canSwap = fromLang !== toLang

	const swap = useCallback(() => {
		setFromLang(toLang)
		setToLang(fromLang)
		setInput(output || samples[toLang])
		setOutput('')
		setError(null)
	}, [fromLang, toLang, output])

	const doConvert = useCallback(async () => {
		setLoading(true)
		setError(null)
		try {
			const res = await ky.post(`${BACKEND_URL}/convert`, {
				json: { code: input, from_lang: fromLang, to_lang: toLang },
			}).json<ConvertResponse>()
			setOutput(res.output)
		} catch (e: unknown) {
			if (e instanceof HTTPError) {
				let message = `Error ${e.response.status}`
				try {
					const body: unknown = await e.response.json()
					if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
						message = body.detail
					}
				} catch {
					// Keep the status when the response has no JSON detail.
				}
				setError(message)
			} else {
				setError(e instanceof Error ? e.message : 'Error')
			}
		} finally {
			setLoading(false)
		}
	}, [input, fromLang, toLang])

	const inputLanguage = useMemo(() => (fromLang === 'python' ? 'python' : 'javascript'), [fromLang])
	const outputLanguage = useMemo(() => (toLang === 'python' ? 'python' : 'javascript'), [toLang])

	return (
		<>
			<div className="header">
				<select value={fromLang} onChange={(e) => {
					const v = e.target.value as Language
					setFromLang(v)
					setInput(samples[v])
				}}>
					<option value="python">Python</option>
					<option value="javascript">JavaScript</option>
				</select>
				<span>→</span>
				<select value={toLang} onChange={(e) => setToLang(e.target.value as Language)}>
					<option value="javascript">JavaScript</option>
					<option value="python">Python</option>
				</select>
				<button onClick={swap} disabled={!canSwap}>Swap</button>
				<button onClick={doConvert} disabled={loading}>Convert{loading ? '…' : ''}</button>
				{error && <span style={{ color: 'crimson' }}>{error}</span>}
			</div>
			<div className="content">
				<div className="pane">
					<div className="paneHeader">Input ({fromLang})</div>
					<Editor className="editor" height="100%" language={inputLanguage} value={input} onChange={(v) => setInput(v ?? '')} options={{ fontSize: 14, minimap: { enabled: false } }} />
				</div>
				<div className="pane">
					<div className="paneHeader">Output ({toLang})</div>
					<Editor className="editor" height="100%" language={outputLanguage} value={output} onChange={() => {}} options={{ readOnly: true, fontSize: 14, minimap: { enabled: false } }} />
				</div>
			</div>
			<div className="footer">Backend: {BACKEND_URL}</div>
		</>
	)
}

export default App
