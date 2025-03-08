import React, { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <h1>State Test</h1>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Increment
      </button>
    </div>
  );
}

export default App;