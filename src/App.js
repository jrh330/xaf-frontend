import React, { useState } from 'react';
import DeckBuilder from './DeckBuilder';
import XATGame from './XATGame';

function App() {
  const [deck, setDeck] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  // Function to be passed to DeckBuilder
  const startGame = (deckData) => {
    setDeck(deckData);
    setGameStarted(true);
  };

  // Function to handle connection status updates
  const handleConnectionStatus = (status) => {
    setConnectionStatus(status);
  };

  return (
    <div className="App">
      {!gameStarted ? (
        <DeckBuilder 
          setDeck={setDeck} 
          startGame={startGame} 
          onConnectionStatus={handleConnectionStatus} 
        />
      ) : (
        <XATGame 
          deck={deck} 
          onConnectionStatus={handleConnectionStatus} 
        />
      )}
      
      {connectionStatus === 'error' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px 15px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          Backend connection issues. Game will connect when available.
        </div>
      )}
    </div>
  );
}

export default App;