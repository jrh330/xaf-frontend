import React, { useState } from "react";
import XATGame from "./XATGame";
import DeckBuilder from "./DeckBuilder";

const App = () => {
  const [deck, setDeck] = useState([]);
  const [gameStarted, setGameStarted] = useState(false); // ✅ Fixed: Added useState and semicolon

  return (
    <div className="p-4 max-w-lg mx-auto">
      {!gameStarted ? (
        <DeckBuilder setDeck={setDeck} startGame={() => setGameStarted(true)} />
      ) : (
        <XATGame deck={deck} />
      )}
    </div>
  );
};

export default App;
