import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/app/store'
import { installSecurityGuard } from '@/security/guard'
import App from './App'
import './styles/global.css'
import './styles/scene.css'

installSecurityGuard()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
