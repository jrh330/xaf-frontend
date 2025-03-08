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

  const returnToDeckBuilder = () => {
    setGameStarted(false);
  };

  return (
    <div className="App p-4">
      <h1 className="text-3xl font-bold text-center mb-6">XAT Card Game</h1>
      
      {!gameStarted ? (
        <DeckBuilder setDeck={setDeck} startGame={startGame} />
      ) : (
        <>
          <button 
            onClick={returnToDeckBuilder}
            className="mb-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            ← Back to Deck Builder
          </button>
          <XATGame deck={deck} />
        </>
      )}
    </div>
  );
}

export default App;