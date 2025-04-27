import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Remove this style forcing code since it's not used in homepay
// const styleForcing = document.createElement('style')
// styleForcing.innerHTML = `
//   /* Force CSS to be processed */
//   :root {
//     --tw-force: 1;
//   }
// `
// document.head.appendChild(styleForcing)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
