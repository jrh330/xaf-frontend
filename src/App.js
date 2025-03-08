import React from 'react';

function App() {
  return (
    <div className="App" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>XAT Game</h1>
      <p>The game is loading. Please wait...</p>
      
      <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Game Instructions</h2>
        <ul>
          <li>Create a deck of 7 cards</li>
          <li>Each card has 5 attributes (A-E)</li>
          <li>Each attribute can have a value from 1-5</li>
          <li>Total attribute points cannot exceed 15 per card</li>
          <li>Play against an opponent in a 7-round match</li>
        </ul>
      </div>
    </div>
  );
}

export default App;