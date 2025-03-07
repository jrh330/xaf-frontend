import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("https://your-backend.onrender.com");

const DeckBuilder = ({ setDeck, startGame }) => {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
  const [isDeckComplete, setIsDeckComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [roundData, setRoundData] = useState(null);

  useEffect(() => {
    socket.on("gameStart", () => {
      setGameStarted(true);
    });
    socket.on("roundPlayed", (data) => {
      setRoundData(data);
    });
    return () => {
      socket.off("gameStart");
      socket.off("roundPlayed");
    };
  }, []);

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
    if (cards.length < 7 && newCard.name.trim() !== "") {
      setCards([...cards, newCard]);
      if (cards.length === 6) setIsDeckComplete(true);
      setNewCard({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
    } else {
      setErrorMessage("Please enter a name for the card.");
    }
  };

  const startGameHandler = () => {
    socket.emit("startGame");
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center" style={{ padding: "20px 50px" }}>
      {!gameStarted ? (
        <>
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
              <div className="border p-4 mb-2 text-center">Drag & Drop Image Here (Max: 800x800)</div>
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
          <button
            onClick={startGameHandler}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            disabled={!isDeckComplete}
          >
            Start Game
          </button>
        </>
      ) : (
        <div>
          <h3 className="text-lg font-bold">Game In Progress</h3>
          {roundData ? (
            <p>Round Attribute: {roundData.attribute}</p>
          ) : (
            <p>Waiting for round...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DeckBuilder;
