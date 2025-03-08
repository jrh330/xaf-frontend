import React, { useState, useEffect } from "react";

// Mock socket functionality for build/deployment when backend is unavailable
const createSocket = () => {
  // Create a mock socket object that won't crash when backend is down
  const mockSocket = {
    on: (event, callback) => {},
    off: (event) => {},
    emit: (event, data) => {
      console.log(`Emitted ${event} with data:`, data);
    },
    id: "mock-socket-id-" + Math.floor(Math.random() * 10000)
  };

  try {
    // Only try to import socket.io-client if we're in browser environment
    if (typeof window !== 'undefined') {
      const io = require('socket.io-client');
      const socket = io("https://xat-backend-i0n8.onrender.com", {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        timeout: 10000,
      });
      
      // Add connection event handlers
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });
      
      return socket;
    }
  } catch (err) {
    console.error("Failed to initialize socket connection:", err);
  }
  
  return mockSocket;
};

// Initialize socket outside component to avoid recreation on rerenders
const socket = createSocket();

const DeckBuilder = ({ setDeck, startGame, onConnectionStatus }) => {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({ 
    name: "", 
    image: "", 
    attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } 
  });
  const [isDeckComplete, setIsDeckComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Handle socket connection status
  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      if (onConnectionStatus) onConnectionStatus('connected');
    };
    
    const handleDisconnect = () => {
      setIsConnected(false);
      if (onConnectionStatus) onConnectionStatus('error');
    };
    
    const handleConnectError = (err) => {
      setIsConnected(false);
      if (onConnectionStatus) onConnectionStatus('error');
    };

    // Add event handlers for connection status
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    
    // Game-specific event handlers
    socket.on("gameStart", () => {
      setGameStarted(true);
    });
    
    socket.on("roundPlayed", (data) => {
      setRoundData(data);
    });

    // Clean up event handlers on unmount
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off("gameStart");
      socket.off("roundPlayed");
    };
  }, [onConnectionStatus]);

  const handleAttributeChange = (attr, value) => {
    const totalPoints = Object.values(newCard.attributes).reduce((sum, val) => sum + val, 0) - newCard.attributes[attr] + value;
    if (totalPoints <= 15) {
      setNewCard({
        ...newCard,
        attributes: { ...newCard.attributes, [attr]: value }
      });
    } else {
      setErrorMessage("Total attribute points cannot exceed 15.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const addCard = () => {
    if (cards.length < 7 && newCard.name.trim() !== "") {
      setCards([...cards, newCard]);
      if (cards.length === 6) setIsDeckComplete(true);
      setNewCard({ name: "", image: "", attributes: { A: 2, B: 2, C: 2, D: 2, E: 2 } });
      setErrorMessage("");
    } else {
      setErrorMessage("Please enter a name for the card.");
    }
  };

  const moveCard = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === cards.length - 1)) {
      return;
    }
    
    const newCards = [...cards];
    const temp = newCards[index];
    newCards[index] = newCards[index + direction];
    newCards[index + direction] = temp;
    setCards(newCards);
  };

  const startGameHandler = () => {
    if (cards.length === 7) {
      try {
        socket.emit("startGame");
      } catch (err) {
        console.error("Error starting game:", err);
      }
      
      if (typeof setDeck === 'function') {
        setDeck(cards);
      }
      
      if (typeof startGame === 'function') {
        startGame(cards);
      }
    } else {
      setErrorMessage("You need 7 cards to start the game.");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto flex flex-col items-center">
      {!gameStarted ? (
        <>
          <div className="w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">Create Your Deck</h2>
            {!isConnected && (
              <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                Warning: Backend connection unavailable. You can still create your deck.
              </div>
            )}
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
              <div className="mt-2 text-sm text-gray-500">
                Total points: {Object.values(newCard.attributes).reduce((sum, val) => sum + val, 0)}/15
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
          <p className="text-sm text-gray-600 mb-4">Use arrows to reorder your cards</p>
          
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
                <th className="border p-1">Total</th>
                <th className="border p-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border p-1 text-center">{index + 1}</td>
                  <td className="border p-1 text-center">
                    {card.image && <img src={card.image} alt="Card" className="w-10 h-10" />}
                  </td>
                  <td className="border p-1">{card.name}</td>
                  <td className="border p-1 text-center">{card.attributes.A}</td>
                  <td className="border p-1 text-center">{card.attributes.B}</td>
                  <td className="border p-1 text-center">{card.attributes.C}</td>
                  <td className="border p-1 text-center">{card.attributes.D}</td>
                  <td className="border p-1 text-center">{card.attributes.E}</td>
                  <td className="border p-1 text-center">
                    {Object.values(card.attributes).reduce((sum, val) => sum + val, 0)}
                  </td>
                  <td className="border p-1 text-center">
                    <button 
                      onClick={() => moveCard(index, -1)} 
                      disabled={index === 0}
                      className="px-2 py-1 bg-gray-200 rounded mr-1 disabled:opacity-50"
                    >
                      ↑
                    </button>
                    <button 
                      onClick={() => moveCard(index, 1)} 
                      disabled={index === cards.length - 1}
                      className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
                    >
                      ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button
            onClick={startGameHandler}
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded"
            disabled={cards.length !== 7}
          >
            Start Game{!isConnected ? " (Offline Mode)" : ""}
          </button>
        </>
      ) : (
        <div>
          <h3 className="text-lg font-bold">Game In Progress</h3>
          {!isConnected && (
            <div className="mt-2 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
              Backend connection unavailable. Waiting for connection...
            </div>
          )}
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