'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { KEYBOARD_ROWS, getRandomWord } from '@/lib/words';
import { cn } from '@/lib/utils';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

export default function WordleGame() {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [keyStates, setKeyStates] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    setTargetWord(getRandomWord());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || isValidating) return;

      const key = e.key.toUpperCase();

      if (key === 'ENTER') {
        handleSubmitGuess();
      } else if (key === 'BACKSPACE') {
        handleDeleteLetter();
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, isValidating]);

  const handleSubmitGuess = async () => {
    if (currentGuess.length !== WORD_LENGTH) {
      toast.error('Word must be 5 letters long');
      return;
    }

    // Prevent multiple submissions while validating
    if (isValidating) return;

    setIsValidating(true);

    try {
      // Check if the word is valid (you'll need to implement this function)
      const isValid = await checkWordValidity(currentGuess);

      if (!isValid) {
        toast.error('Not in word list');
        setIsValidating(false);
        return;
      }

      // Word is valid, proceed with the guess
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);

      // Update keyboard states
      const newKeyStates = { ...keyStates };
      for (let i = 0; i < currentGuess.length; i++) {
        const letter = currentGuess[i];
        if (targetWord[i] === letter) {
          newKeyStates[letter] = 'correct';
        } else if (targetWord.includes(letter) && newKeyStates[letter] !== 'correct') {
          newKeyStates[letter] = 'present';
        } else if (!targetWord.includes(letter)) {
          newKeyStates[letter] = 'absent';
        }
      }
      setKeyStates(newKeyStates);

      if (currentGuess === targetWord) {
        toast.success('Congratulations! You won! 🎉');
        setGameOver(true);
        setGameWon(true);
      } else if (newGuesses.length === MAX_ATTEMPTS) {
        toast.error(`Game Over! The word was ${targetWord}`);
        setGameOver(true);
        setGameWon(false);
      }

      // Clear current guess AFTER processing it
      setCurrentGuess('');
    } catch (error) {
      toast.error('Error validating word');
      console.error('Error validating word:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const checkWordValidity = async (word: string) => {
    toast.success('Checking word validity...', {
      description: 'Please wait a moment'
    });
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);

      console.log(`Checking word validity for: ${word}`, response);

      if (!response.ok) {
        // If the response is not ok (like 404 status), the word doesn't exist
        if (response.status === 404) {
          // Immediately show toast without trying to parse response
          toast.error("Not in word list", {
            description: "Please try a different word"
          });
          console.log("Word not found in dictionary:", word);
          return false;
        }

        // For other error statuses, try to parse the response
        try {
          const errorData = await response.json();
          console.log("Error data:", errorData);

          toast.error("Not in word list", {
            description: "Please try a different word"
          });
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          toast.error("Invalid word");
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking word validity:', error);
      // In case of network error, show a more specific error
      toast.error("Error checking word", {
        description: "Please check your connection and try again"
      });
      // In case of network error, you might want to allow the word anyway
      return true;
    }
  };

  const handleDeleteLetter = () => {
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const getLetterState = (letter: string, position: number, guess: string) => {
    if (guess[position] === targetWord[position]) return 'correct';
    if (targetWord.includes(guess[position])) return 'present';
    return 'absent';
  };

  const renderGrid = () => {
    const rows = [];

    // Render previous guesses
    for (let i = 0; i < guesses.length; i++) {
      const row = [];
      const isLatestGuess = i === guesses.length - 1;

      for (let j = 0; j < WORD_LENGTH; j++) {
        const letter = guesses[i][j];
        const state = getLetterState(letter, j, guesses[i]);
        row.push(
          <motion.div
            key={`${i}-${j}`}
            initial={{ scale: isLatestGuess ? 0 : 1 }}
            animate={{ scale: 1 }}
            transition={{
              delay: isLatestGuess ? j * 0.1 : 0,
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className={cn(
              'w-14 h-14 border-2 flex items-center justify-center text-2xl font-bold rounded m-1',
              state === 'correct' && 'bg-green-500 border-green-600 text-white',
              state === 'present' && 'bg-yellow-500 border-yellow-600 text-white',
              state === 'absent' && 'bg-gray-500 border-gray-600 text-white'
            )}
          >
            {letter}
          </motion.div>
        );
      }

      rows.push(
        <motion.div
          key={i}
          className="flex"
          initial={{ opacity: isLatestGuess ? 0 : 1, y: isLatestGuess ? 10 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: isLatestGuess ? 0.6 : 0, // Add delay after letters animate
            duration: isLatestGuess ? 0.2 : 0
          }}
        >
          {row}
        </motion.div>
      );
    }

    // Render current guess
    if (!gameOver && guesses.length < MAX_ATTEMPTS) {
      const row = [];
      for (let i = 0; i < WORD_LENGTH; i++) {
        row.push(
          <motion.div
            key={`current-${i}`}
            initial={{ scale: currentGuess[i] ? 0 : 1 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20
            }}
            className="w-14 h-14 border-2 border-gray-300 flex items-center justify-center text-2xl font-bold rounded m-1"
          >
            {currentGuess[i] || ''}
          </motion.div>
        );
      }
      rows.push(
        <div key="current" className="flex">
          {row}
        </div>
      );
    }

    // Fill remaining rows with animation on initial load
    for (let i = guesses.length + 1; i < MAX_ATTEMPTS; i++) {
      const row = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        row.push(
          <motion.div
            key={`empty-${i}-${j}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3 + (i * 0.1) + (j * 0.05), // Stagger based on row and column
              duration: 0.2
            }}
            className="w-14 h-14 border-2 border-gray-300 rounded m-1"
          />
        );
      }
      rows.push(
        <motion.div
          key={`empty-${i}`}
          className="flex"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3 + (i * 0.1),
            duration: 0.3
          }}
        >
          {row}
        </motion.div>
      );
    }

    return rows;
  };

  const handleKeyClick = (key: string) => {
    if (gameOver || isValidating) return;

    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === '⌫') {
      handleDeleteLetter();
    } else if (currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {gameOver && !gameWon && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md"
        >
          <div className="flex items-center">
            <div className="py-1 font-semibold">
              The word was: <span className="text-xl uppercase tracking-wider font-bold">{targetWord}</span>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className="grid gap-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {renderGrid()}
      </motion.div>

      <motion.div
        className="flex flex-col gap-2 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.6, // Start keyboard animation after grid is visible
          duration: 0.4
        }}
      >
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key, j) => (
              <motion.button
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.7 + (i * 0.1) + (j * 0.03), // Stagger keyboard keys
                  duration: 0.2
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleKeyClick(key)}
                className={cn(
                  'px-3 py-4 rounded font-bold text-sm sm:text-base',
                  key.length > 1 ? 'px-4' : 'min-w-[40px]',
                  keyStates[key] === 'correct' && 'bg-green-500 text-white',
                  keyStates[key] === 'present' && 'bg-yellow-500 text-white',
                  keyStates[key] === 'absent' && 'bg-gray-500 text-white',
                  !keyStates[key] && 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                {key}
              </motion.button>
            ))}
          </div>
        ))}
      </motion.div>

      {gameOver && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            setTargetWord(getRandomWord());
            setGuesses([]);
            setCurrentGuess('');
            setGameOver(false);
            setGameWon(false);
            setKeyStates({});
          }}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity"
        >
          Play Again
        </motion.button>
      )}
    </div>
  );
}