import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ❌ AuthContext ডিলিট করা হয়েছে
// ✅ এখন App নিজেই PortalProvider ব্যবহার করছে

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
