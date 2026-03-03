import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RoomProvider } from './Context/roomContext.jsx'
import { ChatProvider } from './Context/chatContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RoomProvider >
      <ChatProvider>
        <App />
      </ChatProvider>
    </RoomProvider>
  </StrictMode>,
)
