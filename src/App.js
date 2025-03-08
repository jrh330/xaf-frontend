import React, { useState, useEffect } from 'react';
import DeckBuilder from './DeckBuilder';
// Import but don't render XATGame yet
import XATGame from './XATGame';

function App() {
  const [componentCheck, setComponentCheck] = useState({
    checked: false,
    hasDeckBuilder: false,
    hasXATGame: false
  });

  useEffect(() => {
    const check = {
      checked: true,
      hasDeckBuilder: typeof DeckBuilder === 'function',
      hasXATGame: typeof XATGame === 'function'
    };
    console.log("Component check:", check);
    setComponentCheck(check);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Import Test</h1>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(componentCheck, null, 2)}
      </pre>
    </div>
  );
}

export default App;