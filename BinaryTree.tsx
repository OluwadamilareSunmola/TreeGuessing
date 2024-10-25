import React, { useState, useEffect } from 'react';
import { Brain, Key, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import OpenAI from 'openai';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Initial game tree structure
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

// Configuration constants
const STORAGE_KEY = 'character_game_data';
const API_KEY_STORAGE = 'openai_api_key';

// API Key Modal Component
const ApiKeyModal = ({ onSubmit, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!apiKey.startsWith('sk-')) {
      setError('Invalid API key format. Should start with "sk-"');
      return;
    }
    localStorage.setItem(API_KEY_STORAGE, apiKey);
    onSubmit(apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full bg-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold">OpenAI API Key Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Enter your OpenAI API key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full p-3 border rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <Key className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <div className="text-sm text-gray-600">
                Your API key is stored locally and never sent to our servers.
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Key
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Stats Display Component
const StatsDisplay = ({ streak, questionCount, hintsUsed, confidenceScore }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white p-3 rounded-lg shadow text-center">
      <div className="text-sm text-gray-500">Streak</div>
      <div className="text-xl font-bold">{streak}</div>
    </div>
    <div className="bg-white p-3 rounded-lg shadow text-center">
      <div className="text-sm text-gray-500">Questions</div>
      <div className="text-xl font-bold">{questionCount}</div>
    </div>
    <div className="bg-white p-3 rounded-lg shadow text-center">
      <div className="text-sm text-gray-500">Hints Used</div>
      <div className="text-xl font-bold">{hintsUsed}</div>
    </div>
    <div className="bg-white p-3 rounded-lg shadow text-center">
      <div className="text-sm text-gray-500">AI Confidence</div>
      <div className="text-xl font-bold">{confidenceScore}%</div>
    </div>
  </div>
);

// Main Game Component
const Game = () => {
  // State management
  const [currentNode, setCurrentNode] = useState(initialTree);
  const [path, setPath] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [gameState, setGameState] = useState('playing');
  const [shake, setShake] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(100);
  const [characterFacts, setCharacterFacts] = useState([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');
  const [showApiModal, setShowApiModal] = useState(!localStorage.getItem(API_KEY_STORAGE));
  const [gameTree, setGameTree] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialTree;
  });

  // OpenAI client initialization
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, use backend proxy
  });

  // Save game tree to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameTree));
  }, [gameTree]);

  // AI Integration Functions
  const generateAIQuestion = async (currentCharacter, previousQuestions) => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }

    setAiThinking(true);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at generating yes/no questions for a character guessing game."
          },
          {
            role: "user",
            content: `Generate a yes/no question to help identify a character. 
                     Previous questions: ${previousQuestions.map(p => p.question).join(", ")}.
                     The character might be: ${currentCharacter}`
          }
        ]
      });

      const generatedQuestion = completion.choices[0].message.content;
      setNewQuestion(generatedQuestion);
    } catch (error) {
      console.error('Error generating AI question:', error);
      if (error.response?.status === 401) {
        alert("Invalid API key. Please check your OpenAI API key.");
        setShowApiModal(true);
      }
    } finally {
      setAiThinking(false);
    }
  };

  const getAIHint = async () => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }

    setAiThinking(true);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert at providing helpful hints for a character guessing game."
          },
          {
            role: "user",
            content: `Based on these answers: ${path.map(p => 
              `Q: ${p.node.question} A: ${p.choice ? 'Yes' : 'No'}`
            ).join(', ')}, provide a helpful hint about the character.`
          }
        ]
      });

      setHintsUsed(prev => prev + 1);
      setConfidenceScore(prev => Math.max(prev - 10, 0));
      alert(`AI Hint: ${completion.choices[0].message.content}`);
    } catch (error) {
      console.error('Error getting AI hint:', error);
    } finally {
      setAiThinking(false);
    }
  };

  const verifyCharacterWithAI = async (characterName) => {
    if (!apiKey) {
      setShowApiModal(true);
      return;
    }

    setAiThinking(true);
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert on fictional and real characters. Provide interesting facts."
          },
          {
            role: "user",
            content: `Provide 4 interesting facts about ${characterName} in a bullet point format.`
          }
        ]
      });

      const facts = completion.choices[0].message.content
        .split('\n')
        .filter(fact => fact.trim())
        .map(fact => fact.replace(/^[•\-\*]\s*/, ''));
      
      setCharacterFacts(facts);
    } catch (error) {
      console.error('Error verifying character:', error);
    } finally {
      setAiThinking(false);
    }
  };

  // Game Logic Functions
  const handleAnswer = (isYes) => {
    if (!currentNode || (!currentNode.question && !currentNode.answer)) return;

    const nextNode = isYes ? currentNode.yes : currentNode.no;
    setConfidenceScore(prev => Math.max(prev - 5, 0));

    if (!nextNode) {
      if (currentNode.answer) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        verifyCharacterWithAI(currentNode.answer);
        return;
      }
    } else {
      setPath([...path, { node: currentNode, choice: isYes }]);
      setCurrentNode(nextNode);
      setQuestionCount(prev => prev + 1);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleGuess = (isCorrect) => {
    if (isCorrect) {
      setStreak(prev => prev + 1);
      alert(`Correct! Current streak: ${streak + 1}`);
      restartGame();
    } else {
      setStreak(0);
      setGameState('learning');
    }
  };

  const handleNewCharacter = () => {
    if (!newQuestion || !newAnswer) {
      alert('Please provide both a question and an answer.');
      return;
    }

    const newTreeBranch = {
      question: newQuestion,
      yes: { answer: newAnswer },
      no: currentNode,
    };

    // Update game tree
    let updatedTree = { ...gameTree };
    let currentBranch = updatedTree;
    
    path.forEach((step, index) => {
      if (index === path.length - 1) {
        if (step.choice) {
          currentBranch.yes = newTreeBranch;
        } else {
          currentBranch.no = newTreeBranch;
        }
      } else {
        currentBranch = step.choice ? currentBranch.yes : currentBranch.no;
      }
    });

    setGameTree(updatedTree);
    restartGame();
  };

  const restartGame = () => {
    setCurrentNode(gameTree);
    setPath([]);
    setQuestionCount(0);
    setGameState('playing');
    setConfidenceScore(100);
    setCharacterFacts([]);
    setHintsUsed(0);
    setNewQuestion('');
    setNewAnswer('');
  };

  // Render Functions
  const renderGameState = () => {
    if (aiThinking) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin mr-2">
            <Brain className="w-8 h-8 text-blue-500" />
          </div>
          <span className="text-lg font-semibold">AI is thinking...</span>
        </div>
      );
    }

    if (gameState === 'playing' && currentNode?.question) {
      return (
        <Card className={`w-full max-w-2xl ${shake ? 'animate-bounce' : ''}`}>
          <CardHeader>
            <CardTitle className="text-2xl text-center">{currentNode.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <StatsDisplay
              streak={streak}
              questionCount={questionCount}
              hintsUsed={hintsUsed}
              confidenceScore={confidenceScore}
            />
            
            <div className="flex flex-col space-y-4">
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
              
              <button
                onClick={getAIHint}
                disabled={hintsUsed >= 3}
                className={`transform hover:scale-105 transition-all duration-300 px-6 py-2 
                  ${hintsUsed >= 3 
                    ? 'bg-gray-400' 
                    : 'bg-gradient-to-r from-purple-400 to-purple-600'
                  } 
                  text-white rounded-lg shadow-lg hover:shadow-xl flex items-center justify-center space-x-2`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{hintsUsed >= 3 ? 'No hints remaining' : 'Get AI Hint (-10% confidence)'}</span>
              </button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (currentNode?.answer) {
      return (
        <Card className="w-full max-w-2xl animate-fade-in"><CardHeader>
            <CardTitle className="text-2xl text-center">
              Is your character {currentNode.answer}?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {characterFacts.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  AI-Generated Character Facts:
                </h3>
                <ul className="space-y-2">
                  {characterFacts.map((fact, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-sm text-gray-600">{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col space-y-4">
              <StatsDisplay
                streak={streak}
                questionCount={questionCount}
                hintsUsed={hintsUsed}
                confidenceScore={confidenceScore}
              />
              
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => handleGuess(true)}
                  className="transform hover:scale-110 transition-all duration-300 px-8 py-4 bg-gradient-to-r from-green-400 to-green-600 text-white rounded-lg shadow-lg hover:shadow-2xl flex items-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Yes, that's right!
                </button>
                <button 
                  onClick={() => handleGuess(false)}
                  className="transform hover:scale-110 transition-all duration-300 px-8 py-4 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-lg shadow-lg hover:shadow-2xl flex items-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  No, guess again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (gameState === 'learning') {
      return (
        <Card className="w-full max-w-2xl animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Help me learn!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enter a yes/no question to distinguish your character
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter a yes/no question"
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                  <button
                    onClick={() => generateAIQuestion(newAnswer, path)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                    title="Generate AI Question"
                  >
                    <Brain className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Who was your character?
                </label>
                <input
                  type="text"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="Enter your character's name"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleNewCharacter}
                  className="w-full transform hover:scale-105 transition-all duration-300 px-6 py-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-2xl flex items-center justify-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Add Character to AI's Knowledge
                </button>
              </div>
            </div>

            {newAnswer && (
              <Alert variant="info" className="mt-4">
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Learning Mode</AlertTitle>
                <AlertDescription>
                  Adding "{newAnswer}" to the game's knowledge base. The AI will use this to improve future guesses.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Character Guesser</h1>
          <p className="text-gray-600">Think of a character, and I'll try to guess it!</p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          {renderGameState()}

          {/* API Key Setup Button */}
          <button
            onClick={() => setShowApiModal(true)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <Key className="w-4 h-4 mr-1" />
            Configure API Key
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiModal && (
        <ApiKeyModal
          onSubmit={(key) => {
            setApiKey(key);
            setShowApiModal(false);
          }}
          onClose={() => setShowApiModal(false)}
        />
      )}
    </div>
  );
};

export default Game;
