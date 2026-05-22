import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode disabled: react-konva has known issues with Strict Mode
// double-invocation causing canvas duplication.
createRoot(document.getElementById('root')!).render(<App />)
