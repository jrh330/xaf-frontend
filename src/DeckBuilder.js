import React from 'react';

const DeckBuilder = ({ setDeck, startGame }) => {
  // Create a sample deck
  const createSampleDeck = () => {
    const sampleDeck = [];
    for (let i = 0; i < 7; i++) {
      sampleDeck.push({
        name: `Card ${i+1}`,
        image: "",
        attributes: { A: 3, B: 3, C: 3, D: 3, E: 3 }
      });
    }
    
    if (typeof setDeck === 'function') {
      setDeck(sampleDeck);
    }
    
    if (typeof startGame === 'function') {
      startGame(sampleDeck);
    }
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
      <h2>Deck Builder</h2>
      <p>This is a simplified deck builder.</p>
      <button 
        onClick={createSampleDeck}
        style={{ 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          padding: '10px 15px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Create Sample Deck & Start Game
      </button>
    </div>
  );
};

export default DeckBuilder;