import { useState } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <h1>Welcome to Ladli Frontend</h1>
          <p>Build something amazing with React and TypeScript!</p>
          
          <div className="card">
            <h2>Counter Demo</h2>
            <p>Current Count: <strong>{count}</strong></p>
            <div className="button-group">
              <button onClick={() => setCount(count + 1)}>
                Increment
              </button>
              <button onClick={() => setCount(count - 1)}>
                Decrement
              </button>
              <button onClick={() => setCount(0)}>
                Reset
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Features</h2>
            <ul>
              <li>⚡ Vite for fast development</li>
              <li>⚛️ React 18 with latest features</li>
              <li>🎯 TypeScript for type safety</li>
              <li>🎨 Modern CSS styling</li>
              <li>🚀 Optimized production builds</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
