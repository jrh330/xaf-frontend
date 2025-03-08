import React, { useState } from "react";
import DeckBuilder from "./DeckBuilder";
import XATGame from "./XATGame";

function App() {
  const [deck, setDeck] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = (deckData) => {
    setDeck(deckData);
    setGameStarted(true);
  };

  return (
    <div className="App">
      {!gameStarted ? (
        <DeckBuilder setDeck={setDeck} startGame={startGame} />
      ) : (
        <XATGame deck={deck} />
      )}
    </div>
  );
}

export default App;