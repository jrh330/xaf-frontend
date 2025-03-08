import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://xat-backend-i0n8.onrender.com", {
  transports: ["websocket", "polling"],
});

const XATGame = ({ deck }) => {
  const [gameStatus, setGameStatus] = useState("waiting"); // waiting, playing, over
  const [message, setMessage] = useState("Waiting for opponent...");
  const [round, setRound] = useState(0);
  const [attribute, setAttribute] = useState(null);
  const [playerCard, setPlayerCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [scores, setScores] = useState({});
  const [roundWinner, setRoundWinner] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [playedCards, setPlayedCards] = useState([]);
  const [opponentPlayedCards, setOpponentPlayedCards] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);

  useEffect(() => {
    // Join the game with your deck
    if (deck && deck.length === 7) {
      socket.emit("joinGame", { deck });
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
  }, [deck]);

  // Function to get a CSS class for highlighting the current attribute
  const getAttributeClass = (attr) => {
    return attribute === attr ? "bg-yellow-200 font-bold" : "";
  };

  return (
    <div className="p-4">
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <p className="text-center font-semibold">{message}</p>
      </div>
      
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold">Round {round}/7</h3>
        
        <div className="flex items-center gap-4">
          <div className="text-center px-3 py-1 bg-blue-100 rounded-full">
            <span className="font-bold text-blue-700">You: {scores[socket.id] || 0}</span>
          </div>
          <div className="px-2 py-1 bg-gray-200 rounded-full text-sm">
            VS
          </div>
          <div className="text-center px-3 py-1 bg-red-100 rounded-full">
            <span className="font-bold text-red-700">Opponent: {scores[opponentId] || 0}</span>
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
      
      {/* Three-box layout */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Box - Your Deck */}
        <div className="border border-black p-4 rounded">
          <h3 className="font-bold mb-3 text-center">Your Deck</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left border-b">Card</th>
                  <th className={`p-2 text-center border-b ${getAttributeClass('A')}`}>A</th>
                  <th className={`p-2 text-center border-b ${getAttributeClass('B')}`}>B</th>
                  <th className={`p-2 text-center border-b ${getAttributeClass('C')}`}>C</th>
                  <th className={`p-2 text-center border-b ${getAttributeClass('D')}`}>D</th>
                  <th className={`p-2 text-center border-b ${getAttributeClass('E')}`}>E</th>
                </tr>
              </thead>
              <tbody>
                {deck ? deck.map((card, idx) => (
                  <tr key={idx} className={idx === round - 1 ? "bg-blue-100" : idx < round - 1 ? "bg-gray-100" : ""}>
                    <td className="p-2 border-b">{card.name}</td>
                    <td className={`p-2 text-center border-b ${getAttributeClass('A')}`}>{card.attributes.A}</td>
                    <td className={`p-2 text-center border-b ${getAttributeClass('B')}`}>{card.attributes.B}</td>
                    <td className={`p-2 text-center border-b ${getAttributeClass('C')}`}>{card.attributes.C}</td>
                    <td className={`p-2 text-center border-b ${getAttributeClass('D')}`}>{card.attributes.D}</td>
                    <td className={`p-2 text-center border-b ${getAttributeClass('E')}`}>{card.attributes.E}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No cards in deck</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Middle Box - Current Gameplay */}
        <div className="border border-black p-4 rounded">
          <h3 className="font-bold mb-3 text-center">Current Round</h3>
          
          {gameStatus === "waiting" ? (
            <div className="text-center p-8">
              <p className="text-lg">Waiting for opponent...</p>
              <div className="mt-4 animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : gameStatus === "playing" ? (
            <>
              {playerCard && round > 0 ? (
                <div className="relative">
                  <div className={`p-4 rounded-lg ${roundWinner === socket.id || roundWinner === "tie" ? "bg-green-100 border border-green-500" : "bg-blue-100 border border-blue-300"}`}>
                    <h4 className="font-bold text-center mb-2">Your Card (Round {round})</h4>
                    <p className="text-center text-lg mb-2">{playerCard.name}</p>
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
                    <div className="mt-4 p-4 rounded-lg bg-red-100 border border-red-300">
                      <h4 className="font-bold text-center mb-2">Opponent's Card</h4>
                      <p className="text-center text-lg mb-2">{opponentCard.name}</p>
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
                    <div className="mt-4 text-center p-2 rounded bg-gray-100">
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
        <div className="border border-black p-4 rounded">
          <h3 className="font-bold mb-3 text-center">Opponent's Cards</h3>
          
          {opponentPlayedCards.length > 0 ? (
            <div className="overflow-y-auto max-h-80">
              {opponentPlayedCards.map((card, idx) => (
                <div key={idx} className="mb-3 p-3 bg-gray-50 rounded border">
                  <p className="font-bold mb-1">Round {idx + 1}: {card.name}</p>
                  <div className="grid grid-cols-5 gap-1 text-xs">
                    {Object.entries(card.attributes).map(([key, value]) => (
                      <div key={key} className={`text-center p-1 ${roundHistory[idx]?.attribute === key ? 'bg-yellow-100' : ''}`}>
                        <div className="font-bold">{key}</div>
                        <div>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <p>No cards played yet</p>
              <p className="text-sm mt-2">Opponent's cards will appear here as they are played</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Game History - Show after game is over */}
      {gameStatus === "over" && roundHistory.length > 0 && (
        <div className="mt-8 border border-black p-4 rounded">
          <h3 className="font-bold mb-3">Round History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">Round</th>
                <th className="p-2 text-left">Attribute</th>
                <th className="p-2 text-left">Your Card</th>
                <th className="p-2 text-left">Your Value</th>
                <th className="p-2 text-left">Opponent Card</th>
                <th className="p-2 text-left">Opponent Value</th>
                <th className="p-2 text-left">Result</th>
              </tr>
            </thead>
            <tbody>
              {roundHistory.map((round, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="p-2">{round.round}</td>
                  <td className="p-2">{round.attribute}</td>
                  <td className="p-2">{round.playerCard?.name}</td>
                  <td className="p-2">{round.playerValue}</td>
                  <td className="p-2">{round.opponentCard?.name}</td>
                  <td className="p-2">{round.opponentValue}</td>
                  <td className="p-2">
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