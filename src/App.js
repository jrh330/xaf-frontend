import React, { useState } from 'react';
import DeckBuilder from './DeckBuilder';
import XATGame from './XATGame';

function App() {
  const [deck, setDeck] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = (deckData) => {
    console.log("Starting game with deck:", deckData);
    setDeck(deckData);
    setGameStarted(true);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>XAT Game</h1>
      {!gameStarted ? (
        <>
          <p>Create your deck to start playing:</p>
          <DeckBuilder setDeck={setDeck} startGame={startGame} />
        </>
      ) : (
        <>
          <p>Game started!</p>
          <button 
            onClick={() => setGameStarted(false)}
            style={{ marginBottom: '20px', padding: '5px 10px' }}
          >
            Back to Deck Builder
          </button>
          <XATGame deck={deck} />
        </>
      )}
    </div>
  );
}

export default App;