import React, { useState, useEffect } from 'react';
import DeckBuilder from './DeckBuilder';
import XATGame from './XATGame';

function App() {
  const [deck, setDeck] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  
  // Load saved deck and player name from localStorage when the app starts
  useEffect(() => {
    const savedDeck = localStorage.getItem('xatDeck');
    const savedName = localStorage.getItem('xatPlayerName');
    
    if (savedDeck) {
      try {
        const parsedDeck = JSON.parse(savedDeck);
        setDeck(parsedDeck);
      } catch (error) {
        console.error("Failed to parse saved deck:", error);
      }
    }
    
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const startGame = (deckData) => {
    console.log("Starting game with deck:", deckData);
    setDeck(deckData);
    setGameStarted(true);
    
    // Save player name
    if (playerName) {
      localStorage.setItem('xatPlayerName', playerName);
    }
  };

  const returnToDeckBuilder = () => {
    setGameStarted(false);
  };

  const handleNameChange = (e) => {
    setPlayerName(e.target.value);
  };

  return (
    <div className="App p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">XAT Card Game</h1>
      
      {!gameStarted ? (
        <>
          <div className="mb-6 max-w-md mx-auto">
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name (optional)
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={handleNameChange}
              placeholder="Enter your name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <DeckBuilder setDeck={setDeck} startGame={startGame} initialDeck={deck} />
        </>
      ) : (
        <div>
          <button 
            onClick={returnToDeckBuilder}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-bold flex items-center"
          >
            <span className="mr-1">←</span> Back to Deck Builder
          </button>
          <XATGame deck={deck} playerName={playerName} />
        </div>
      )}
    </div>
  );
}

export default App;