export type Direction = 'py2js' | 'js2py';

let worker: Worker | null = null;
let readyPromise: Promise<void> | null = null;

function ensureWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./pyodide-worker.js', import.meta.url));
  }
  return worker;
}

export function initPyodide(): Promise<void> {
  if (readyPromise) return readyPromise;
  const w = ensureWorker();
  readyPromise = new Promise((resolve, reject) => {
    const handleMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (data?.type === 'ready') {
        w.removeEventListener('message', handleMessage);
        resolve();
      } else if (data?.type === 'error') {
        w.removeEventListener('message', handleMessage);
        reject(new Error(data.error || 'Initialization failed'));
      }
    };
    w.addEventListener('message', handleMessage);
    w.postMessage({ type: 'init' });
  });
  return readyPromise;
}

export async function convertCode(direction: Direction, code: string): Promise<string> {
  await initPyodide();
  const w = ensureWorker();
  return new Promise((resolve, reject) => {
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data;
      if (data?.type === 'result') {
        w.removeEventListener('message', onMessage);
        resolve(String(data.output ?? ''));
      } else if (data?.type === 'error') {
        w.removeEventListener('message', onMessage);
        reject(new Error(data.error || 'Conversion error'));
      }
    };
    w.addEventListener('message', onMessage);
    w.postMessage({ type: 'convert', direction, code });
  });
}

