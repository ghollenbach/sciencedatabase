import { useState } from 'react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('Current')

  const tabs = ['Current', 'Want', 'Requested']

  return (
    <div className="App">
      <header className="page-header">
        <h1>Science Department Inventory</h1>
      </header>

      <nav className="tabs" aria-label="Inventory sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' is-active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      <section className="content">
        <div className="search-row">
          <input
            className="search-input"
            type="text"
            placeholder="Search here..."
            aria-label={`Search ${activeTab} inventory`}
          />
          <button className="search-button" type="button" aria-label="Search">
            <span aria-hidden="true">🔍</span>
          </button>
        </div>
      </section>
    </div>
  )
}

export default App
