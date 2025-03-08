import React, { useState, useEffect } from 'react';
// Import but don't render DeckBuilder yet
import DeckBuilder from './DeckBuilder';

function App() {
  const [componentCheck, setComponentCheck] = useState({
    checked: false,
    hasDeckBuilder: false
  });

  useEffect(() => {
    // Check if DeckBuilder exists
    const check = {
      checked: true,
      hasDeckBuilder: typeof DeckBuilder === 'function'
    };
    console.log("Component check:", check);
    setComponentCheck(check);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Import Test</h1>
      <p>Check complete: {componentCheck.checked ? 'Yes' : 'No'}</p>
      <p>DeckBuilder available: {componentCheck.hasDeckBuilder ? 'Yes' : 'No'}</p>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(componentCheck, null, 2)}
      </pre>
    </div>
  );
}

export default App;