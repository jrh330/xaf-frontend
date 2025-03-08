import React, { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("https://xat-backend-i0n8.onrender.com", {
  transports: ["websocket", "polling"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const XATGame = ({ deck }) => {
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
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Error handling for socket connection
    socket.on("connect", () => {
      console.log("Connected to server");
      setConnectionError(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
      setConnectionError(true);
      setMessage("Connection error. Trying to reconnect...");
    });

    // Join the game with deck
    if (deck && deck.length === 7) {
      try {
        socket.emit("joinGame", { deck });
        console.log("Joining game with deck:", deck);
      } catch (err) {
        console.error("Error joining game:", err);
      }
    }
    
    socket.on("waitingForOpponent", () => {
      setMessage("Waiting for an opponent to join...");
    });

    socket.on("gameStart", (data) => {
      console.log("Game started:", data);
      setGameStatus("playing");
      setMessage("Game started!");
      
      if (data.playerIds && data.playerIds.length === 2) {
        const otherPlayerId = data.playerIds.find(id => id !== socket.id);
        setOpponentId(otherPlayerId);
        setScores({ [socket.id]: 0, [otherPlayerId]: 0 });
      }
    });

    socket.on("roundResult", (data) => {
      console.log("Round result:", data);
      if (data.round) setRound(data.round);
      if (data.attribute) setAttribute(data.attribute);
      
      if (data.player1Card && data.player2Card) {
        if (socket.id === data.player1Card.playerId) {
          setPlayerCard(data.player1Card);
          setOpponentCard(data.player2Card);
        } else {
          setPlayerCard(data.player2Card);
          setOpponentCard(data.player1Card);
        }
      }
      
      if (data.roundWinner) setRoundWinner(data.roundWinner);
      if (data.scores) setScores(data.scores);
      
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
      socket.off("connect");
      socket.off("connect_error");
      socket.off("waitingForOpponent");
      socket.off("gameStart");
      socket.off("roundResult");
      socket.off("gameOver");
      socket.off("opponentDisconnected");
      socket.off("gameError");
    };
  }, [deck]);

  if (connectionError) {
    return (
      <div className="p-4 max-w-lg mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Connection Error</h2>
        <p className="mb-4">Unable to connect to the game server. Please check your internet connection and try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">XAT Game</h2>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <p className="text-center font-semibold">{message}</p>
      </div>
      
      {gameStatus === "playing" && (
        <>
          <h3 className="text-lg font-bold text-center mb-2">Round {round}/7</h3>
          {attribute && (
            <div className="mb-4 text-center">
              <span className="bg-purple-500 text-white px-4 py-1 rounded-full inline-block">
                Attribute: {attribute}
              </span>
            </div>
          )}
          
          <div className="mb-4 flex justify-between items-center">
            <div className="text-center font-bold">
              You: {scores[socket.id] || 0}
            </div>
            <div className="px-2 py-1 bg-gray-200 rounded text-sm">
              VS
            </div>
            <div className="text-center font-bold">
              Opponent: {scores[opponentId] || 0}
            </div>
          </div>
          
          {playerCard && opponentCard ? (
            <div className="mt-4 flex justify-between gap-4">
              <div className="p-4 border rounded-lg bg-blue-500 shadow text-white" style={{ minWidth: "45%" }}>
                <h4 className="font-bold text-center border-b pb-1 mb-2">Your Card</h4>
                <p className="text-center text-lg mb-3">{playerCard.name}</p>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {Object.entries(playerCard.attributes || {}).map(([key, value]) => (
                    <div key={key} className={`text-center ${key === attribute ? 'bg-yellow-300 text-black rounded p-1' : ''}`}>
                      <div className="font-bold">{key}</div>
                      <div>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-red-500 shadow text-white" style={{ minWidth: "45%" }}>
                <h4 className="font-bold text-center border-b pb-1 mb-2">Opponent's Card</h4>
                <p className="text-center text-lg mb-3">{opponentCard.name}</p>
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {Object.entries(opponentCard.attributes || {}).map(([key, value]) => (
                    <div key={key} className={`text-center ${key === attribute ? 'bg-yellow-300 text-black rounded p-1' : ''}`}>
                      <div className="font-bold">{key}</div>
                      <div>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p>Loading cards...</p>
            </div>
          )}
        </>
      )}
      
      {gameStatus === "over" && (
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">
            {gameWinner === socket.id ? "You Won!" : gameWinner === "tie" || gameWinner === null ? "It's a Tie!" : "You Lost!"}
          </h3>
          <p className="mb-4">Final Score: You {scores[socket.id] || 0} - {scores[opponentId] || 0} Opponent</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default XATGame;