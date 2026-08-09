import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// StrictMode는 개발 중 effect를 두 번 돌려 OAuth code 교환이 실패할 수 있어 사용하지 않음
createRoot(document.getElementById('root')!).render(<App />)
