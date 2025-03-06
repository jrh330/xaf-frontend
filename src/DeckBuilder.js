import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("http://localhost:3001");

const DeckBuilder = ({ setDeck, startGame }) => {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
  const [isDeckComplete, setIsDeckComplete] = useState(false);

  const handleAttributeChange = (attr, value) => {
    const totalPoints = Object.values(newCard.attributes).reduce((sum, val) => sum + val, 0) - newCard.attributes[attr] + value;
    if (totalPoints <= 15) {
      setNewCard({
        ...newCard,
        attributes: { ...newCard.attributes, [attr]: value }
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewCard({ ...newCard, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addCard = () => {
    if (cards.length < 7) {
      setCards([...cards, newCard]);
      if (cards.length === 6) setIsDeckComplete(true);
      setNewCard({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex" style={{ paddingRight: "50px" }}>
      <div className="w-2/3">
        <h2 className="text-xl font-bold mb-4">Create Your Deck</h2>
        <div className="mb-4 p-4 border rounded">
          <input
            type="text"
            placeholder="Card Name"
            value={newCard.name}
            onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
            className="block w-full p-2 border rounded mb-2"
            disabled={isDeckComplete}
          />
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleImageUpload}
            className="block w-full p-2 border rounded mb-2"
            disabled={isDeckComplete}
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
                  disabled={isDeckComplete}
                />
              </div>
            ))}
          </div>
          <button
            onClick={addCard}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            disabled={isDeckComplete}
          >
            Add Card
          </button>
        </div>
      </div>
      <div className="w-1/3 pl-4">
        <h3 className="text-lg font-bold mb-2">Your Deck ({cards.length}/7)</h3>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-1">#</th>
              <th className="border p-1">Name</th>
              <th className="border p-1">A</th>
              <th className="border p-1">B</th>
              <th className="border p-1">C</th>
              <th className="border p-1">D</th>
              <th className="border p-1">E</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, index) => (
              <tr key={index}>
                <td className="border p-1 text-center">{index + 1}</td>
                <td className="border p-1">{card.name}</td>
                <td className="border p-1 text-center">{card.attributes.A}</td>
                <td className="border p-1 text-center">{card.attributes.B}</td>
                <td className="border p-1 text-center">{card.attributes.C}</td>
                <td className="border p-1 text-center">{card.attributes.D}</td>
                <td className="border p-1 text-center">{card.attributes.E}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeckBuilder;
