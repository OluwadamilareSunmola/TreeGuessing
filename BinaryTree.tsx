import React, { useState } from 'react';

const initialTree = {
  question: "Is your character from a cartoon?",
  yes: {
    question: "Is your character an animal?",
    yes: {
      question: "Is your character a mouse?",
      yes: {
        answer: "Mickey Mouse",
      },
      no: {
        answer: "Donald Duck",
      },
    },
    no: {
      answer: "Homer Simpson",
    },
  },
  no: {
    answer: "Superman",
  },
};

const Game = () => {
  const [currentNode, setCurrentNode] = useState(initialTree);
  const [path, setPath] = useState([]); // Store the path taken
  const [questionCount, setQuestionCount] = useState(0); // Track question number
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [gameState, setGameState] = useState('playing'); // 'playing', 'guessing', 'learning'
  const [shake, setShake] = useState(false); // Animation state

  // Function to handle yes/no answers and move down the tree
  const handleAnswer = (isYes) => {
    if (!currentNode || (!currentNode.question && !currentNode.answer)) return;

    const nextNode = isYes ? currentNode.yes : currentNode.no;

    if (!nextNode) {
      if (currentNode.answer) {
        // We've reached an answer node (terminal)
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
    } else {
      // If there's a next node, continue progressing through the tree
      setPath([...path, { node: currentNode, choice: isYes }]);
      setCurrentNode(nextNode);
      setQuestionCount(prev => prev + 1);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  // Function to handle guessing (when we've reached an answer node)
  const handleGuess = (isCorrect) => {
    if (isCorrect) {
      alert('Yay! I guessed correctly!');
      restartGame();
    } else {
      setGameState('learning');
    }
  };

  // Handle new character learning
  const handleNewCharacter = () => {
    const newTreeBranch = {
      question: newQuestion,
      yes: { answer: newAnswer },
      no: currentNode, // The current node becomes the "no" branch
    };

    const newTree = { ...path[path.length - 1].node };
    if (path[path.length - 1].choice) {
      newTree.yes = newTreeBranch;
    } else {
      newTree.no = newTreeBranch;
    }

    // Update the entire path leading to the new question
    let updatedTree = initialTree;
    path.forEach((step, index) => {
      const node = { ...updatedTree };
      if (step.choice) {
        node.yes = step.node;
      } else {
        node.no = step.node;
      }
      updatedTree = node;
    });

    setCurrentNode(newTreeBranch);
    setNewQuestion('');
    setNewAnswer('');
    setPath([]);
    setGameState('playing');
    setQuestionCount(0);
  };

  // Restart the game after completion
  const restartGame = () => {
    setCurrentNode(initialTree);
    setPath([]);
    setQuestionCount(0);
    setGameState('playing');
  };

  // Rendering logic based on game state
  const renderGameState = () => {
    if (gameState === 'playing' && currentNode?.question) {
      return (
        <div className={`space-y-6 transform transition-transform ${shake ? 'animate-bounce' : ''}`}>
          <div className="relative p-6 bg-white bg-opacity-90 rounded-lg shadow-xl">
            <div className="text-2xl font-bold text-center mb-4">{currentNode.question}</div>
            <div className="text-sm text-gray-500 text-center mb-4">Question {questionCount + 1}</div>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => handleAnswer(true)}
                className="transform hover:scale-110 transition-all duration-300 px-8 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow-lg hover:shadow-2xl"
              >
                Yes
              </button>
              <button 
                onClick={() => handleAnswer(false)}
                className="transform hover:scale-110 transition-all duration-300 px-8 py-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg shadow-lg hover:shadow-2xl"
              >
                No
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (currentNode?.answer) {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="relative p-6 bg-white bg-opacity-90 rounded-lg shadow-xl">
            <div className="text-4xl text-center mb-4">🤔</div>
            <div className="text-2xl font-bold text-center mb-6">
              Is your character {currentNode.answer}?
            </div>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => handleGuess(true)}
                className="transform hover:scale-110 transition-all duration-300 px-8 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow-lg hover:shadow-2xl"
              >
                Yes!
              </button>
              <button 
                onClick={() => handleGuess(false)}
                className="transform hover:scale-110 transition-all duration-300 px-8 py-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg shadow-lg hover:shadow-2xl"
              >
                No
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Learning state if guess was wrong and we need to add a new character
    if (gameState === 'learning') {
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="relative p-6 bg-white bg-opacity-90 rounded-lg shadow-xl">
            <div className="text-4xl text-center mb-4">🎓</div>
            <div className="text-xl font-bold text-center mb-6">
              Help me learn! Add a new question to distinguish your character.
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter a yes/no question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
              <input
                type="text"
                placeholder="Who was your character?"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
              />
              <button 
                onClick={handleNewCharacter}
                className="w-full transform hover:scale-105 transition-all duration-300 px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-2xl"
              >
                Add Character
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {renderGameState()}
    </div>
  );
};

export default Game;
