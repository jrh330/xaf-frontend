import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

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
  const [playerId, setPlayerId] = useState(socket.id);
  const [roundWinner, setRoundWinner] = useState(null);
  const [gameWinner, setGameWinner] = useState(null);
  const [opponentId, setOpponentId] = useState(null);
  const [roundHistory, setRoundHistory] = useState([]);

  useEffect(() => {
    // Join the game with your deck when component mounts
    socket.emit("joinGame", { deck });
    console.log("Joining game with deck:", deck);
    
    socket.on("waitingForOpponent", () => {
      setMessage("Waiting for an opponent to join...");
    });

    socket.on("gameStart", (data) => {
      console.log("Game started:", data);
      setGameStatus("playing");
      setMessage("Game started!");
      
      // Store opponent ID
      const otherPlayerId = data.playerIds.find(id => id !== socket.id);
      setOpponentId(otherPlayerId);
      
      // Initialize scores
      setScores({ [socket.id]: 0, [otherPlayerId]: 0 });
    });

    socket.on("roundResult", (data) => {
      console.log("Round result:", data);
      setRound(data.round);
      setAttribute(data.attribute);
      
      // Set cards based on player perspective
      if (socket.id === data.player1Card.playerId) {
        setPlayerCard(data.player1Card);
        setOpponentCard(data.player2Card);
      } else {
        setPlayerCard(data.player2Card);
        setOpponentCard(data.player1Card);
      }
      
      setRoundWinner(data.roundWinner);
      setScores(data.scores);
      
      // Add to round history
      setRoundHistory(prev => [...prev, {
        round: data.round,
        attribute: data.attribute,
        winner: data.roundWinner,
        playerValue: data.player1Card.playerId === socket.id 
          ? data.player1Card.attributes[data.attribute]
          : data.player2Card.attributes[data.attribute],
        opponentValue: data.player1Card.playerId === socket.id
          ? data.player2Card.attributes[data.attribute]
          : data.player1Card.attributes[data.attribute]
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
      setGameWinner(data.winner);
      setScores(data.scores);
      
      if (data.winner === socket.id) {
        setMessage("Congratulations! You won the game!");
      } else if (data.winner === "tie") {
        setMessage("The game ended in a tie!");
      } else if (data.winner === null) {
        setMessage("The game ended in a tie!");
      } else {
        setMessage("Game over! Your opponent won.");
      }
    });

    socket.on("opponentDisconnected", (data) => {
      console.log("Opponent disconnected:", data);
      setGameStatus("over");
      setMessage(data.message);
      if (data.winner === socket.id) {
        setGameWinner(socket.id);
      }
    });

    socket.on("gameError", (data) => {
      console.error("Game error:", data);
      setMessage(`Error: ${data.message}`);
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

  const getCardClasses = (isPlayer) => {
    let classes = "p-4 border rounded-lg shadow-lg transition-all duration-300 ";
    
    if (isPlayer) {
      classes += "bg-blue-500 text-white ";
      if (roundWinner === socket.id || roundWinner === "tie") classes += "ring-4 ring-yellow-400 ";
    } else {
      classes += "bg-red-500 text-white ";
      if (roundWinner === opponentId || roundWinner === "tie") classes += "ring-4 ring-yellow-400 ";
    }
    
    return classes;
  };

  return (
    <div className="p-4 max-w-3xl mx-auto bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">XAT Game</h2>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <p className="text-center font-semibold">{message}</p>
      </div>
      
      {gameStatus === "playing" && (
        <>
          <div className="flex justify-between items-center mb-4">
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
          
          {playerCard && opponentCard ? (
            <div className="mt-4 flex justify-between gap-4">
              <motion.div 
                initial={{ rotateY: 180, opacity: 0 }} 
                animate={{ rotateY: 0, opacity: 1 }} 
                transition={{ duration: 0.6 }} 
                className={getCardClasses(true)}
                style={{ minWidth: "45%" }}
              >
                <h4 className="font-bold text-center border-b pb-1 mb-2">Your Card</h4>
                <p className="text-center text-lg mb-3">{playerCard.name}</p>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {Object.entries(playerCard.attributes).map(([key, value]) => (
                    <div key={key} className={`text-center ${key === attribute ? 'bg-yellow-300 text-black rounded p-1 font-bold' : ''}`}>
                      <div className="font-bold">{key}</div>
                      <div>{value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ rotateY: 180, opacity: 0 }} 
                animate={{ rotateY: 0, opacity: 1 }} 
                transition={{ duration: 0.6, delay: 0.3 }} 
                className={getCardClasses(false)}
                style={{ minWidth: "45%" }}
              >
                <h4 className="font-bold text-center border-b pb-1 mb-2">Opponent's Card</h4>
                <p className="text-center text-lg mb-3">{opponentCard.name}</p>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {Object.entries(opponentCard.attributes).map(([key, value]) => (
                    <div key={key} className={`text-center ${key === attribute ? 'bg-yellow-300 text-black rounded p-1 font-bold' : ''}`}>
                      <div className="font-bold">{key}</div>
                      <div>{value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded shadow">
              <div className="animate-pulse">
                <p className="text-xl">Waiting for next round...</p>
              </div>
            </div>
          )}
          
          {/* Round History */}
          {roundHistory.length > 0 && (
            <div className="mt-8 bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold mb-2">Round History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Round</th>
                      <th className="p-2 text-left">Attribute</th>
                      <th className="p-2 text-left">Your Value</th>
                      <th className="p-2 text-left">Opponent Value</th>
                      <th className="p-2 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundHistory.map((round, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-2">{round.round}</td>
                        <td className="p-2">{round.attribute}</td>
                        <td className="p-2">{round.playerValue}</td>
                        <td className="p-2">{round.opponentValue}</td>
                        <td className="p-2">
                          {round.winner === socket.id ? (
                            <span className="text-green-600 font-bold">Win</span>
                          ) : round.winner === "tie" ? (
                            <span className="text-blue-600 font-bold">Tie</span>
                          ) : (
                            <span className="text-red-600 font-bold">Loss</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      
      {gameStatus === "over" && (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">
            {gameWinner === socket.id ? "You Won!" : gameWinner === "tie" || gameWinner === null ? "It's a Tie!" : "You Lost!"}
          </h3>
          <p className="mb-6 text-lg">Final Score: <span className="font-bold text-blue-600">{scores[socket.id] || 0}</span> - <span className="font-bold text-red-600">{scores[opponentId] || 0}</span></p>
          
          {/* Round History in game over state */}
          {roundHistory.length > 0 && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <h4 className="font-bold mb-2">Match History</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Round</th>
                      <th className="p-2 text-left">Attribute</th>
                      <th className="p-2 text-left">Your Value</th>
                      <th className="p-2 text-left">Opponent Value</th>
                      <th className="p-2 text-left">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roundHistory.map((round, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-2">{round.round}</td>
                        <td className="p-2">{round.attribute}</td>
                        <td className="p-2">{round.playerValue}</td>
                        <td className="p-2">{round.opponentValue}</td>
                        <td className="p-2">
                          {round.winner === socket.id ? (
                            <span className="text-green-600 font-bold">Win</span>
                          ) : round.winner === "tie" ? (
                            <span className="text-blue-600 font-bold">Tie</span>
                          ) : (
                            <span className="text-red-600 font-bold">Loss</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-bold"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default XATGame;