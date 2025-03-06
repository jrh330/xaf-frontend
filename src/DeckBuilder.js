import React, { useState } from "react";  // ✅ This is the only React import

const DeckBuilder = ({ setDeck, startGame }) => {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: "", attributes: { A: 1, B: 1, C: 1, D: 1, E: 1 } });

  const handleAttributeChange = (attr, value) => {
    const totalPoints = Object.values(newCard.attributes).reduce((sum, val) => sum + val, 0) - newCard.attributes[attr] + value;
    if (totalPoints <= 15) {
      setNewCard({
        ...newCard,
        attributes: { ...newCard.attributes, [attr]: value }
      });
    }
  };

  const addCard = () => {
    if (cards.length < 7) {
      setCards([...cards, newCard]);
      setNewCard({ name: "", attributes: { A: 1, B: 1, C: 1, D: 1, E: 1 } });
    }
  };

  const finalizeDeck = () => {
    if (cards.length === 7) {
      setDeck(cards);
      startGame();
    } else {
      alert("You need exactly 7 cards to start!");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Your Deck</h2>
      <div className="mb-4 p-4 border rounded">
        <input
          type="text"
          placeholder="Card Name"
          value={newCard.name}
          onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
          className="block w-full p-2 border rounded mb-2"
        />
        <div className="grid grid-cols-5 gap-2">
          {Object.keys(newCard.attributes).map((attr) => (
            <div key={attr} className="text-center">
              <label className="block font-bold">{attr}</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newCard.attributes[attr]}
                onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value))}
                className="w-full p-1 border rounded"
              />
            </div>
          ))}
        </div>
        <button onClick={addCard} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Add Card</button>
        <button onClick={finalizeDeck} className="mt-4 bg-green-500 text-white px-4 py-2 rounded ml-2">Start Game</button>
      </div>
    </div>
  );
};

export default DeckBuilder;
