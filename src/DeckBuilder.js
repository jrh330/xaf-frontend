import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://xat-backend-i0n8.onrender.com", {
  transports: ["websocket", "polling"],
});

const DeckBuilder = ({ setDeck, startGame, initialDeck = null }) => {
  const [cards, setCards] = useState(initialDeck || []);
  const [newCard, setNewCard] = useState({ 
    name: "", 
    image: "", 
    imagePreview: "",
    attributes: { A: 3, B: 3, C: 3, D: 3, E: 3 } 
  });
  const [isDeckComplete, setIsDeckComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [totalPoints, setTotalPoints] = useState(15);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    socket.on("gameStart", () => {
      setGameStarted(true);
    });
    socket.on("roundPlayed", (data) => {
      setRoundData(data);
    });
    
    // If we have an initialDeck with 7 cards, mark the deck as complete
    if (initialDeck && initialDeck.length === 7) {
      setIsDeckComplete(true);
    }
    
    return () => {
      socket.off("gameStart");
      socket.off("roundPlayed");
    };
  }, [initialDeck]);

  // Update total points calculation whenever attributes change
  useEffect(() => {
    const sum = Object.values(newCard.attributes).reduce((sum, val) => sum + val, 0);
    setTotalPoints(sum);
  }, [newCard.attributes]);

  const handleAttributeChange = (attr, value) => {
    // Don't allow values below 1 or above 5
    if (value < 1 || value > 5) return;
    
    // Calculate what the total would be with this change
    const currentTotal = Object.values(newCard.attributes).reduce((sum, val) => sum + val, 0);
    const newTotal = currentTotal - newCard.attributes[attr] + value;
    
    // Only allow the change if it doesn't exceed 15 points
    if (newTotal <= 15) {
      setNewCard({
        ...newCard,
        attributes: { ...newCard.attributes, [attr]: value }
      });
    } else {
      setErrorMessage("Total attribute points cannot exceed 15.");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageError("");

    // Create an image object to check dimensions
    const img = new Image();
    img.onload = () => {
      // Check if image is too large
      if (img.width > 800 || img.height > 800) {
        setImageError("Image too large. Maximum size is 800x800 pixels.");
        URL.revokeObjectURL(img.src);
        return;
      }

      // Process the image - center crop and resize to 80x80
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 80;
      canvas.height = 80;

      // Calculate dimensions for center crop
      const size = Math.min(img.width, img.height);
      const startX = (img.width - size) / 2;
      const startY = (img.height - size) / 2;

      // Draw the center portion of the image
      ctx.drawImage(
        img, 
        startX, startY, size, size,
        0, 0, 80, 80
      );

      // Convert to base64 data URL
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Update the newCard state with the processed image
      setNewCard({
        ...newCard,
        image: dataUrl,
        imagePreview: dataUrl
      });

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      setImageError("Failed to load image. Please try another file.");
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  };

  const addCard = () => {
    if (cards.length < 7 && newCard.name.trim() !== "") {
      // Add card with current stats to the deck
      setCards([...cards, { ...newCard }]);
      
      // Check if this completes the deck
      if (cards.length === 6) {
        setIsDeckComplete(true);
      }
      
      // Reset the form for the next card
      setNewCard({ 
        name: "", 
        image: "", 
        imagePreview: "",
        attributes: { A: 3, B: 3, C: 3, D: 3, E: 3 } 
      });
      setErrorMessage("");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  const editCard = (index) => {
    // Load the selected card into the editor
    setNewCard({ ...cards[index] });
    
    // Remove the card from the deck
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
    
    // If deck was complete, it's no longer complete
    setIsDeckComplete(false);
  };
  
  const removeCard = (index) => {
    // Remove the card from the deck
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
    
    // If deck was complete, it's no longer complete
    setIsDeckComplete(false);
  };

  const startGameHandler = () => {
    if (cards.length === 7) {
      // Save the deck to localStorage for persistence
      localStorage.setItem('xatDeck', JSON.stringify(cards));
      
      if (typeof setDeck === 'function') {
        setDeck(cards);
      }
      
      if (typeof startGame === 'function') {
        startGame(cards);
      }
      
      // Emit the deck to the server
      socket.emit("startGame", { deck: cards });
    } else {
      setErrorMessage("You need 7 cards to start the game.");
    }
  };
  
  const createNewDeck = () => {
    setCards([]);
    setIsDeckComplete(false);
    setNewCard({ 
      name: "", 
      image: "", 
      imagePreview: "",
      attributes: { A: 3, B: 3, C: 3, D: 3, E: 3 } 
    });
    
    // Clear localStorage
    localStorage.removeItem('xatDeck');
  };

  // Helper function to generate a random deck for testing
  const createRandomDeck = () => {
    const randomDeck = [];
    
    for (let i = 0; i < 7; i++) {
      // Create a card with random attribute values that sum to 15
      const attributes = { A: 1, B: 1, C: 1, D: 1, E: 1 };
      let remainingPoints = 10; // 5 already allocated
      
      const keys = ['A', 'B', 'C', 'D', 'E'];
      
      // Randomly distribute the remaining points
      while (remainingPoints > 0) {
        const randomAttr = keys[Math.floor(Math.random() * keys.length)];
        if (attributes[randomAttr] < 5) {
          attributes[randomAttr]++;
          remainingPoints--;
        }
      }
      
      randomDeck.push({
        name: `Card ${i+1}`,
        image: "",
        imagePreview: "",
        attributes
      });
    }
    
    setCards(randomDeck);
    setIsDeckComplete(true);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="p-4" style={{ padding: "50px" }}>
      {!gameStarted ? (
        <>
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Your Deck</h2>
              
              {/* Add buttons for deck management */}
              <div className="flex space-x-2">
                {cards.length > 0 && (
                  <button
                    onClick={createNewDeck}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Create New Deck
                  </button>
                )}
                
                {cards.length === 0 && (
                  <button
                    onClick={createRandomDeck}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Generate Random Deck
                  </button>
                )}
              </div>
            </div>
            
            <div className="mb-4 p-4 border rounded shadow-sm">
              <input
                type="text"
                placeholder="Card Name"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                className="block w-full p-2 border rounded mb-4"
                disabled={isDeckComplete}
              />
              
              <div 
                className="border p-4 mb-4 text-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                onClick={triggerFileInput}
              >
                {newCard.imagePreview ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={newCard.imagePreview} 
                      alt="Card preview" 
                      className="w-20 h-20 object-cover border mb-2" 
                    />
                    <p className="text-sm text-gray-500">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <p>Click to Upload Image (Max: 800x800)</p>
                    <p className="text-sm text-gray-500 mt-1">Image will be center-cropped and resized</p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden"
                  disabled={isDeckComplete}
                />
              </div>
              
              {imageError && <p className="text-red-500 mb-4">{imageError}</p>}
              {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
              
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-bold">Attributes</span>
                  <span className={totalPoints > 15 ? "text-red-500 font-bold" : "text-green-600"}>
                    Total: {totalPoints}/15
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {Object.keys(newCard.attributes).map((attr) => (
                    <div key={attr} className="text-center">
                      <label className="block font-bold mb-1">{attr}</label>
                      <div className="flex flex-col">
                        <button 
                          onClick={() => handleAttributeChange(attr, newCard.attributes[attr] + 1)}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-t text-gray-700"
                          disabled={isDeckComplete || newCard.attributes[attr] >= 5 || totalPoints >= 15}
                        >
                          ▲
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={newCard.attributes[attr]}
                          onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value))}
                          className="w-full p-1 border text-center"
                          disabled={isDeckComplete}
                        />
                        <button 
                          onClick={() => handleAttributeChange(attr, newCard.attributes[attr] - 1)}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 rounded-b text-gray-700"
                          disabled={isDeckComplete || newCard.attributes[attr] <= 1}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex">
                <button
                  onClick={addCard}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={isDeckComplete}
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
          
          <div className="w-full max-w-3xl mx-auto">
            <h3 className="text-lg font-bold mb-2">Your Deck ({cards.length}/7)</h3>
            <p className="text-sm text-gray-600 mb-4">Use arrows to reorder your cards</p>
            
            {cards.length > 0 ? (
              <table className="w-full border shadow-sm mb-6">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">#</th>
                    <th className="border p-2">Image</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">A</th>
                    <th className="border p-2">B</th>
                    <th className="border p-2">C</th>
                    <th className="border p-2">D</th>
                    <th className="border p-2">E</th>
                    <th className="border p-2">Total</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map((card, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2 text-center">
                        {card.image ? (
                          <img src={card.image} alt="Card" className="w-16 h-16 object-cover mx-auto" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded mx-auto"></div>
                        )}
                      </td>
                      <td className="border p-2">{card.name}</td>
                      <td className="border p-2 text-center">{card.attributes.A}</td>
                      <td className="border p-2 text-center">{card.attributes.B}</td>
                      <td className="border p-2 text-center">{card.attributes.C}</td>
                      <td className="border p-2 text-center">{card.attributes.D}</td>
                      <td className="border p-2 text-center">{card.attributes.E}</td>
                      <td className="border p-2 text-center">
                        {Object.values(card.attributes).reduce((sum, val) => sum + val, 0)}
                      </td>
                      <td className="border p-2">
                        <div className="flex justify-center space-x-1">
                          {!isDeckComplete && (
                            <>
                              <button 
                                onClick={() => editCard(index)} 
                                className="px-2 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xs"
                                title="Edit card"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => removeCard(index)} 
                                className="px-2 py-1 bg-red-400 hover:bg-red-500 text-white rounded text-xs"
                                title="Remove card"
                              >
                                ✕
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => moveCard(index, -1)} 
                            disabled={index === 0}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 text-xs"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button 
                            onClick={() => moveCard(index, 1)} 
                            disabled={index === cards.length - 1}
                            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 text-xs"
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center p-4 border rounded bg-gray-50 w-full mb-6">
                <p className="text-gray-500">No cards in your deck yet. Add some cards to get started!</p>
              </div>
            )}
            
            <button
              onClick={startGameHandler}
              className="mt-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded font-bold"
              disabled={cards.length !== 7}
            >
              Start Game
            </button>
            
            {cards.length !== 7 && (
              <p className="text-sm text-gray-500 mt-2">You need 7 cards to start the game.</p>
            )}
          </div>
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