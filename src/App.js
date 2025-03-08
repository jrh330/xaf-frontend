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
    <div className="App p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">XAT Card Game</h1>
      
      {!gameStarted ? (
        <DeckBuilder setDeck={setDeck} startGame={startGame} />
      ) : (
        <div>
          <button 
            onClick={returnToDeckBuilder}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold flex items-center"
          >
            <span className="mr-1">←</span> Back to Deck Builder
          </button>
          <XATGame deck={deck} />
        </div>
      )}
    </div>
  );
}

export default App;