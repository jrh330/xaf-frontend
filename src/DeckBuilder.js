import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("http://localhost:3001");

const DeckBuilder = ({ setDeck, startGame }) => {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
  const [isDeckComplete, setIsDeckComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    event.preventDefault();
    const file = event.dataTransfer ? event.dataTransfer.files[0] : event.target.files[0];
    if (file) {
      const img = new Image();
      img.onload = () => {
        if (img.width > 800 || img.height > 800) {
          setErrorMessage("Image is too large. Maximum size allowed is 800x800 pixels.");
          return;
        }
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setNewCard({ ...newCard, image: canvas.toDataURL() });
        setErrorMessage("");
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const addCard = () => {
    if (cards.length < 7 && newCard.name.trim() !== "") {
      setCards([...cards, newCard]);
      if (cards.length === 6) setIsDeckComplete(true);
      setNewCard({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
    } else {
      setErrorMessage("Please enter a name for the card.");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center" style={{ padding: "20px 50px" }}>
      <div className="w-full max-w-3xl">
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
          <div className="border p-4 mb-2 text-center" onDrop={handleImageUpload} onDragOver={(e) => e.preventDefault()}>
            Drag & Drop Image Here (Max: 800x800)
          </div>
          {newCard.image && <img src={newCard.image} alt="Card" className="w-24 h-24 mx-auto mb-2" />}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
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
      <div className="w-full max-w-3xl">
        <h3 className="text-lg font-bold mb-2">Your Deck ({cards.length}/7)</h3>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-1">#</th>
              <th className="border p-1">Image</th>
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
                <td className="border p-1 text-center">{card.image && <img src={card.image} alt="Card" className="w-10 h-10" />}</td>
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
      <button
        onClick={startGame}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
        disabled={!isDeckComplete}
      >
        Start Game
      </button>
    </div>
  );
};

export default DeckBuilder;
