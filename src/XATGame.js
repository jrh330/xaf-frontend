import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

const socket = io("https://xat-backend-i0n8.onrender.com", {
  transports: ["websocket", "polling"],
});

const XATGame = ({ deck }) => {
  const [round, setRound] = useState(0);
  const [attribute, setAttribute] = useState(null);
  const [playerCard, setPlayerCard] = useState(null);
  const [opponentCard, setOpponentCard] = useState(null);
  const [scores, setScores] = useState({});
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    socket.emit("joinGame", { deck });
    console.log("Joining game with deck:", deck);
    socket.on("gameStart", (data) => {
      console.log("Game started:", data);
    });

    socket.on("roundResult", ({ round, attribute, player1Card, player2Card, scores }) => {
      setRound(round);
      setAttribute(attribute);
      setPlayerCard(player1Card);
      setOpponentCard(player2Card);
      setScores(scores);
    });

    socket.on("gameOver", ({ winner, scores }) => {
      setGameOver(true);
      setWinner(winner);
      setScores(scores);
    });

    return () => {
      socket.off("gameStart");
      socket.off("roundResult");
      socket.off("gameOver");
    };
  }, [deck]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">XAT Game</h2>
      {gameOver ? (
        <h3 className="text-lg font-bold">Game Over! Winner: {winner}</h3>
      ) : (
        <>
          <h3 className="text-lg font-bold">Round {round + 1}/7</h3>
          {attribute && <p>Selected Attribute: {attribute}</p>}
          {playerCard && opponentCard ? (
            <div className="mt-4 flex justify-between">
              <motion.div 
                initial={{ rotateY: 180 }} 
                animate={{ rotateY: 0 }} 
                transition={{ duration: 0.6 }} 
                className="p-4 border rounded-lg bg-blue-500 shadow text-white">
                <h4 className="font-bold">Your Card</h4>
                <p>{playerCard.name}</p>
              </motion.div>
              <motion.div 
                initial={{ rotateY: 180 }} 
                animate={{ rotateY: 0 }} 
                transition={{ duration: 0.6 }} 
                className="p-4 border rounded-lg bg-red-500 shadow text-white">
                <h4 className="font-bold">Opponent's Card</h4>
                <p>{opponentCard.name}</p>
              </motion.div>
            </div>
          ) : (
            <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Waiting for Round</button>
          )}
          <p className="mt-4">Scores - You: {scores[socket.id] || 0} | Opponent: {scores[socket.id] || 0}</p>
        </>
      )}
    </div>
  );
};

export default XATGame;
