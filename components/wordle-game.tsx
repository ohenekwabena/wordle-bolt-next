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
  const [keyStates, setKeyStates] = useState<Record<string, string>>({});

  useEffect(() => {
    setTargetWord(getRandomWord());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;

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
  }, [currentGuess, gameOver]);

  const handleSubmitGuess = () => {
    if (currentGuess.length !== WORD_LENGTH) {
      toast.error('Word must be 5 letters long');
      return;
    }

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
    } else if (newGuesses.length === MAX_ATTEMPTS) {
      toast.error(`Game Over! The word was ${targetWord}`);
      setGameOver(true);
    }

    setCurrentGuess('');
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
      for (let j = 0; j < WORD_LENGTH; j++) {
        const letter = guesses[i][j];
        const state = getLetterState(letter, j, guesses[i]);
        row.push(
          <motion.div
            key={`${i}-${j}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: j * 0.1 }}
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
        <div key={i} className="flex">
          {row}
        </div>
      );
    }

    // Render current guess
    if (!gameOver && guesses.length < MAX_ATTEMPTS) {
      const row = [];
      for (let i = 0; i < WORD_LENGTH; i++) {
        row.push(
          <motion.div
            key={`current-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
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

    // Fill remaining rows
    for (let i = guesses.length + 1; i < MAX_ATTEMPTS; i++) {
      const row = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        row.push(
          <div
            key={`empty-${i}-${j}`}
            className="w-14 h-14 border-2 border-gray-300 rounded m-1"
          />
        );
      }
      rows.push(
        <div key={`empty-${i}`} className="flex">
          {row}
        </div>
      );
    }

    return rows;
  };

  const handleKeyClick = (key: string) => {
    if (gameOver) return;
    
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
      <div className="grid gap-1">{renderGrid()}</div>
      
      <div className="flex flex-col gap-2 w-full max-w-2xl">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.map((key) => (
              <motion.button
                key={key}
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
      </div>

      {gameOver && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => {
            setTargetWord(getRandomWord());
            setGuesses([]);
            setCurrentGuess('');
            setGameOver(false);
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