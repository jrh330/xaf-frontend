import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://xat-backend-i0n8.onrender.com", {
  transports: ["websocket", "polling"],
});

// Generate a random emoji for cards without images
const getRandomEmoji = () => {
  const emojis = [
    "🃏", "🎮", "🎯", "🎲", "🎴", "🎭", "🎨", "🧩",
    "⚔️", "🛡️", "🔮", "💎", "🏆", "🥇", "🌟", "✨",
    "🦁", "🐯", "🐉", "🦅", "🦊", "🐺", "🦄", "🐲"
  ];
  return emojis[Math.floor(Math.random() * emojis.length)];
};

// Create emoji image data URL
const createEmojiImage = (emoji) => {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 80, 80);
  
  // Draw emoji
  ctx.fillStyle = '#000';
  ctx.font = '40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 40, 40);
  
  return canvas.toDataURL('image/png');
};

const XATGame = ({ deck, playerName = '' }) => {
  const [gameStatus, setGameStatus] = useState("waiting");
  const [message, setMessage] = useState("Waiting for opponent...");
  const [round, setRound] = useState(0);
  const [attribute, setAttribute] = useState(null);
  const [playerCard, setPlayerCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [scores, setScores] = useState({});
  const [roundWinner, setRoundWinner] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [opponentName, setOpponentName] = useState("Player 2");
  const [playedCards, setPlayedCards] = useState([]);
  const [opponentPlayedCards, setOpponentPlayedCards] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);

  // Ensure all cards have images by adding emoji placeholders
  useEffect(() => {
    if (deck && deck.length) {
      const updatedDeck = deck.map(card => {
        if (!card.image) {
          const emoji = getRandomEmoji();
          return {
            ...card,
            image: createEmojiImage(emoji),
            emojiUsed: emoji
          };
        }
        return card;
      });
      
      // If the deck was updated with emojis, we might want to emit it to the server
      const hasChanges = updatedDeck.some((card, i) => card.image !== deck[i].image);
      if (hasChanges) {
        socket.emit("updateDeck", { deck: updatedDeck });
      }
    }
  }, [deck]);

  useEffect(() => {
    // Join the game with your deck and player name
    if (deck && deck.length === 7) {
      socket.emit("joinGame", { 
        deck,
        playerName: playerName || "You"
      });
      console.log("Joining game with deck:", deck);
    }
    
    socket.on("waitingForOpponent", () => {
      setMessage("Waiting for an opponent to join...");
    });

    socket.on("gameStart", (data) => {
      console.log("Game started:", data);
      setGameStatus("playing");
      setMessage("Game started!");
      
      if (data && data.playerIds && data.playerIds.length === 2) {
        const otherPlayerId = data.playerIds.find(id => id !== socket.id);
        setOpponentId(otherPlayerId);
        setScores({ [socket.id]: 0, [otherPlayerId]: 0 });
        
        // Set opponent name if provided
        if (data.playerNames && data.playerNames[otherPlayerId]) {
          setOpponentName(data.playerNames[otherPlayerId]);
        }
      }
    });

    socket.on("roundResult", (data) => {
      console.log("Round result:", data);
      setRound(data.round);
      setAttribute(data.attribute);
      
      let playerCurrentCard, opponentCurrentCard;
      
      // Set cards based on player perspective
      if (data.player1Card && data.player2Card) {
        if (socket.id === data.player1Card.playerId) {
          playerCurrentCard = data.player1Card;
          opponentCurrentCard = data.player2Card;
        } else {
          playerCurrentCard = data.player2Card;
          opponentCurrentCard = data.player1Card;
        }
        
        // Ensure cards have images
        if (!playerCurrentCard.image) {
          const emoji = getRandomEmoji();
          playerCurrentCard.image = createEmojiImage(emoji);
          playerCurrentCard.emojiUsed = emoji;
        }
        
        if (!opponentCurrentCard.image) {
          const emoji = getRandomEmoji();
          opponentCurrentCard.image = createEmojiImage(emoji);
          opponentCurrentCard.emojiUsed = emoji;
        }
        
        setPlayerCard(playerCurrentCard);
        setOpponentCard(opponentCurrentCard);
        
        // Add to played cards history
        setPlayedCards(prev => [...prev, playerCurrentCard]);
        setOpponentPlayedCards(prev => [...prev, opponentCurrentCard]);
      }
      
      if (data.roundWinner) setRoundWinner(data.roundWinner);
      if (data.scores) setScores(data.scores);
      
      // Add to round history
      setRoundHistory(prev => [...prev, {
        round: data.round,
        attribute: data.attribute,
        playerCard: playerCurrentCard,
        opponentCard: opponentCurrentCard,
        winner: data.roundWinner,
        playerValue: playerCurrentCard?.attributes[data.attribute],
        opponentValue: opponentCurrentCard?.attributes[data.attribute]
      }]);
      
      // Display who won the round
      if (data.roundWinner === "tie") {
        setMessage("This round was a tie! Both players get a point.");
      } else if (data.roundWinner === socket.id) {
        setMessage("You won this round!");
      } else if (data.roundWinner === null) {
        setMessage("This round was a tie!");
      } else {
        setMessage("Your opponent won this round!");
      }
    });

    socket.on("gameOver", (data) => {
      console.log("Game over:", data);
      setGameStatus("over");
      if (data.winner) setGameWinner(data.winner);
      if (data.scores) setScores(data.scores);
      
      if (data.winner === socket.id) {
        setMessage("Congratulations! You won the game!");
      } else if (data.winner === "tie" || data.winner === null) {
        setMessage("The game ended in a tie!");
      } else {
        setMessage("Game over! Your opponent won.");
      }
    });

    socket.on("opponentDisconnected", (data) => {
      console.log("Opponent disconnected:", data);
      setGameStatus("over");
      setMessage(data.message || "Your opponent disconnected.");
      if (data.winner === socket.id) {
        setGameWinner(socket.id);
      }
    });

    socket.on("gameError", (data) => {
      console.error("Game error:", data);
      setMessage(`Error: ${data.message || "Unknown game error"}`);
    });

    return () => {
      socket.off("waitingForOpponent");
      socket.off("gameStart");
      socket.off("roundResult");
      socket.off("gameOver");
      socket.off("opponentDisconnected");
      socket.off("gameError");
    };
  }, [deck, playerName]);

  // Function to get a CSS class for highlighting the current attribute
  const getAttributeClass = (attr) => {
    return attribute === attr ? "bg-yellow-200 font-bold" : "";
  };

  const getPlayerDisplayName = () => {
    return playerName || "You";
  };

  return (
    <div className="p-4" style={{ padding: "0 50px" }}>
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <p className="text-center font-semibold">{message}</p>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold">Round {round}/7</h3>
        
        <div className="flex items-center gap-4">
          <div className="text-center px-3 py-1 bg-blue-100 rounded-full">
            <span className="font-bold text-blue-700">{getPlayerDisplayName()}: {scores[socket.id] || 0}</span>
          </div>
          <div className="px-2 py-1 bg-gray-200 rounded-full text-sm">
            VS
          </div>
          <div className="text-center px-3 py-1 bg-red-100 rounded-full">
            <span className="font-bold text-red-700">{opponentName}: {scores[opponentId] || 0}</span>
          </div>
        </div>
      </div>
      
      {attribute && (
        <div className="mb-6 text-center">
          <span className="bg-purple-500 text-white px-6 py-2 rounded-full inline-block text-lg font-bold">
            Attribute: {attribute}
          </span>
        </div>
      )}
      
      {/* Three-box layout with proper borders - IMPORTANT: Use flex instead of grid */}
      <div className="flex flex-row gap-4 mb-6" style={{ display: "flex !important", flexDirection: "row !important" }}>
        {/* Left Box - Your Deck */}
        <div className="border-2 border-black p-4 rounded flex-1" style={{ flexBasis: "33%", minHeight: "500px" }}>
          <h3 className="font-bold mb-3 text-center border-b pb-2">Your Deck</h3>
          <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
            <table className="w-full text-sm border-collapse border border-gray-300" style={{ tableLayout: "fixed" }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border border-gray-300" style={{ width: "60px" }}>Card</th>
                  <th className="p-2 text-center border border-gray-300" style={{ width: "80px" }}>Image</th>
                  <th className={`p-2 text-center border border-gray-300 ${getAttributeClass('A')}`} style={{ width: "30px" }}>A</th>
                  <th className={`p-2 text-center border border-gray-300 ${getAttributeClass('B')}`} style={{ width: "30px" }}>B</th>
                  <th className={`p-2 text-center border border-gray-300 ${getAttributeClass('C')}`} style={{ width: "30px" }}>C</th>
                  <th className={`p-2 text-center border border-gray-300 ${getAttributeClass('D')}`} style={{ width: "30px" }}>D</th>
                  <th className={`p-2 text-center border border-gray-300 ${getAttributeClass('E')}`} style={{ width: "30px" }}>E</th>
                </tr>
              </thead>
              <tbody>
                {deck ? deck.map((card, idx) => (
                  <tr key={idx} className={idx === round - 1 ? "bg-blue-100" : idx < round - 1 ? "bg-gray-100" : ""}>
                    <td className="p-2 border border-gray-300">{card.name || `Card ${idx+1}`}</td>
                    <td className="p-2 border border-gray-300 text-center">
                      {card.image ? (
                        <img src={card.image} alt="Card" className="w-16 h-16 object-cover mx-auto" />
                      ) : card.emojiUsed ? (
                        <div className="w-16 h-16 bg-gray-200 rounded mx-auto flex items-center justify-center text-4xl">
                          {card.emojiUsed}
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded mx-auto"></div>
                      )}
                    </td>
                    <td className={`p-2 text-center border border-gray-300 ${getAttributeClass('A')}`}>{card.attributes.A}</td>
                    <td className={`p-2 text-center border border-gray-300 ${getAttributeClass('B')}`}>{card.attributes.B}</td>
                    <td className={`p-2 text-center border border-gray-300 ${getAttributeClass('C')}`}>{card.attributes.C}</td>
                    <td className={`p-2 text-center border border-gray-300 ${getAttributeClass('D')}`}>{card.attributes.D}</td>
                    <td className={`p-2 text-center border border-gray-300 ${getAttributeClass('E')}`}>{card.attributes.E}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-gray-500 border border-gray-300">No cards in deck</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Middle Box - Current Gameplay */}
        <div className="border-2 border-black p-4 rounded flex-1" style={{ flexBasis: "33%", minHeight: "500px" }}>
          <h3 className="font-bold mb-3 text-center border-b pb-2">Current Round</h3>
          
          {gameStatus === "waiting" ? (
            <div className="text-center p-8">
              <p className="text-lg">Waiting for opponent...</p>
              <div className="mt-4 animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : gameStatus === "playing" ? (
            <>
              {playerCard && round > 0 ? (
                <div>
                  <div className={`p-4 rounded-lg mb-4 ${roundWinner === socket.id || roundWinner === "tie" ? "bg-green-100 border border-green-500" : "bg-blue-100 border border-blue-300"}`}>
                    <h4 className="font-bold text-center mb-2">{getPlayerDisplayName()}'s Card (Round {round})</h4>
                    
                    <div className="flex justify-center mb-2">
                      {playerCard.image ? (
                        <img 
                          src={playerCard.image} 
                          alt="Card" 
                          className="w-20 h-20 object-cover border border-gray-300 rounded"
                        />
                      ) : playerCard.emojiUsed ? (
                        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-5xl">
                          {playerCard.emojiUsed}
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-5xl">
                          {getRandomEmoji()}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-center text-lg mb-2">{playerCard.name || `Card ${round}`}</p>
                    <div className="grid grid-cols-5 gap-1 mt-3">
                      {Object.entries(playerCard.attributes).map(([key, value]) => (
                        <div key={key} className={`text-center p-2 ${key === attribute ? 'bg-yellow-300 rounded font-bold' : ''}`}>
                          <div className="font-bold">{key}</div>
                          <div>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {opponentCard && (
                    <div className="p-4 rounded-lg bg-red-100 border border-red-300 mb-4">
                      <h4 className="font-bold text-center mb-2">{opponentName}'s Card</h4>
                      
                      <div className="flex justify-center mb-2">
                        {opponentCard.image ? (
                          <img 
                            src={opponentCard.image} 
                            alt="Card" 
                            className="w-20 h-20 object-cover border border-gray-300 rounded"
                          />
                        ) : opponentCard.emojiUsed ? (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-5xl">
                            {opponentCard.emojiUsed}
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-5xl">
                            {getRandomEmoji()}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-center text-lg mb-2">{opponentCard.name || `Card ${round}`}</p>
                      <div className="grid grid-cols-5 gap-1 mt-3">
                        {Object.entries(opponentCard.attributes).map(([key, value]) => (
                          <div key={key} className={`text-center p-2 ${key === attribute ? 'bg-yellow-300 rounded font-bold' : ''}`}>
                            <div className="font-bold">{key}</div>
                            <div>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {roundWinner && (
                    <div className="text-center p-2 rounded bg-gray-100">
                      <p className="font-bold">
                        {roundWinner === socket.id 
                          ? "You won this round!" 
                          : roundWinner === "tie" 
                            ? "This round was a tie!" 
                            : "Your opponent won this round!"}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-lg">Game in progress...</p>
                  <p>Waiting for first round to start.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-6">
              <h3 className="text-xl font-bold mb-4">
                {gameWinner === socket.id ? "You Won!" : gameWinner === "tie" || gameWinner === null ? "It's a Tie!" : "You Lost!"}
              </h3>
              <p className="mb-4">Final Score: <span className="font-bold text-blue-600">{scores[socket.id] || 0}</span> - <span className="font-bold text-red-600">{scores[opponentId] || 0}</span></p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
              >
                Play Again
              </button>
            </div>
          )}
        </div>
        
        {/* Right Box - Opponent's Played Cards */}
        <div className="border-2 border-black p-4 rounded flex-1" style={{ flexBasis: "33%", minHeight: "500px" }}>
          <h3 className="font-bold mb-3 text-center border-b pb-2">{opponentName}'s Cards</h3>
          
          {opponentPlayedCards.length > 0 ? (
            <div className="overflow-y-auto" style={{ maxHeight: "430px" }}>
              <table className="w-full text-sm border-collapse border border-gray-300" style={{ tableLayout: "fixed" }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left border border-gray-300" style={{ width: "50px" }}>Round</th>
                    <th className="p-2 text-left border border-gray-300">Card</th>
                    <th className="p-2 text-center border border-gray-300" style={{ width: "80px" }}>Image</th>
                    <th className="p-2 text-center border border-gray-300" style={{ width: "30px" }}>A</th>
                    <th className="p-2 text-center border border-gray-300" style={{ width: "30px" }}>B</th>
                    <th className="p-2 text-center border border-gray-300" style={{ width: "30px" }}>C</th>
                    <th className="p-2 text-center border border-gray-300" style={{ width: "30px" }}>D</th>
                    <th className="p-2 text-center border border-gray-300" style={{ width: "30px" }}>E</th>
                  </tr>
                </thead>
                <tbody>
                  {opponentPlayedCards.map((card, idx) => (
                    <tr key={idx} className={idx === opponentPlayedCards.length - 1 ? "bg-red-50" : ""}>
                      <td className="p-2 border border-gray-300">{idx + 1}</td>
                      <td className="p-2 border border-gray-300">{card.name || `Card ${idx+1}`}</td>
                      <td className="p-2 border border-gray-300 text-center">
                        {card.image ? (
                          <img src={card.image} alt="Card" className="w-16 h-16 object-cover mx-auto" />
                        ) : card.emojiUsed ? (
                          <div className="w-16 h-16 bg-gray-200 rounded mx-auto flex items-center justify-center text-4xl">
                            {card.emojiUsed}
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded mx-auto"></div>
                        )}
                      </td>
                      <td className={`p-2 text-center border border-gray-300 ${roundHistory[idx]?.attribute === 'A' ? 'bg-yellow-100' : ''}`}>{card.attributes.A}</td>
                      <td className={`p-2 text-center border border-gray-300 ${roundHistory[idx]?.attribute === 'B' ? 'bg-yellow-100' : ''}`}>{card.attributes.B}</td>
                      <td className={`p-2 text-center border border-gray-300 ${roundHistory[idx]?.attribute === 'C' ? 'bg-yellow-100' : ''}`}>{card.attributes.C}</td>
                      <td className={`p-2 text-center border border-gray-300 ${roundHistory[idx]?.attribute === 'D' ? 'bg-yellow-100' : ''}`}>{card.attributes.D}</td>
                      <td className={`p-2 text-center border border-gray-300 ${roundHistory[idx]?.attribute === 'E' ? 'bg-yellow-100' : ''}`}>{card.attributes.E}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <p>No cards played yet</p>
              <p className="text-sm mt-2">{opponentName}'s cards will appear here as they are played</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Game History - Show after game is over */}
      {gameStatus === "over" && roundHistory.length > 0 && (
        <div className="mt-4 border-2 border-black p-4 rounded">
          <h3 className="font-bold mb-3 text-center border-b pb-2">Round History</h3>
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left border border-gray-300">Round</th>
                <th className="p-2 text-left border border-gray-300">Attribute</th>
                <th className="p-2 text-left border border-gray-300">Your Card</th>
                <th className="p-2 text-left border border-gray-300">Your Value</th>
                <th className="p-2 text-left border border-gray-300">{opponentName}'s Card</th>
                <th className="p-2 text-left border border-gray-300">{opponentName}'s Value</th>
                <th className="p-2 text-left border border-gray-300">Result</th>
              </tr>
            </thead>
            <tbody>
              {roundHistory.map((round, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="p-2 border border-gray-300">{round.round}</td>
                  <td className="p-2 border border-gray-300">{round.attribute}</td>
                  <td className="p-2 border border-gray-300">{round.playerCard?.name || `Card ${round.round}`}</td>
                  <td className="p-2 border border-gray-300">{round.playerValue}</td>
                  <td className="p-2 border border-gray-300">{round.opponentCard?.name || `Card ${round.round}`}</td>
                  <td className="p-2 border border-gray-300">{round.opponentValue}</td>
                  <td className="p-2 border border-gray-300">
                    <span className={
                      round.winner === socket.id ? "text-green-600 font-bold" : 
                      round.winner === "tie" ? "text-blue-600 font-bold" : "text-red-600 font-bold"
                    }>
                      {round.winner === socket.id ? "WIN" : 
                       round.winner === "tie" ? "TIE" : "LOSS"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default XATGame;