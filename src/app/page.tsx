"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SonnetPage() {
  const [gameState, setGameState] = useState('input'); // input, generating, finished
  const [theme, setTheme] = useState('');
  const [poemLines, setPoemLines] = useState<{line: string, visuals: {bgColor: string, circleColor: string, size: number, speed: number}}[]>([]);

  const fetchLine = useCallback(async (currentTheme: string, currentLineNumber: number, history: string[]) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: currentTheme, lineNumber: currentLineNumber, history }),
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setPoemLines(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to fetch next line:", error);
      setGameState('input'); // Reset on error
    }
  }, []);

  // Effect to fetch subsequent lines after a delay
  useEffect(() => {
    if (gameState === 'generating' && poemLines.length > 0 && poemLines.length < 4) {
      const timer = setTimeout(() => {
        const history = poemLines.map(p => p.line);
        fetchLine(theme, poemLines.length, history);
      }, 7000); // 7-second delay between lines
      return () => clearTimeout(timer);
    } else if (poemLines.length >= 4) {
        const timer = setTimeout(() => setGameState('finished'), 4000);
        return () => clearTimeout(timer);
    }
  }, [poemLines, gameState, theme, fetchLine]);

  const handleStart = () => {
    if (theme.trim()) {
      setPoemLines([]);
      setGameState('generating');
      fetchLine(theme, 0, []); // Fetch the first line immediately
    }
  };

  const handleReset = () => {
    setPoemLines([]);
    setTheme('');
    setGameState('input');
  };

  const currentLine = poemLines[poemLines.length - 1];

  return (
    <motion.div
      className="w-full h-screen overflow-hidden flex items-center justify-center"
      animate={{ backgroundColor: currentLine?.visuals?.bgColor || '#111' }}
      transition={{ duration: 2, ease: "easeInOut" }}
    >
      <AnimatePresence>
        {gameState === 'input' && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h1 className="text-white text-5xl font-serif mb-8">Symbiotic Sonnet</h1>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleStart()}
              className="bg-transparent border-b-2 border-gray-500 text-white text-2xl text-center focus:outline-none focus:border-white transition-colors duration-300"
              placeholder="Enter a theme (e.g., City)"
            />
          </motion.div>
        )}

        {gameState === 'generating' && currentLine && (
          <motion.div
            key={currentLine.line}
            className="text-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            <motion.div
              className="mx-auto rounded-full"
              animate={{
                backgroundColor: currentLine?.visuals?.circleColor,
                width: currentLine?.visuals?.size,
                height: currentLine?.visuals?.size,
              }}
              transition={{ duration: 2, ease: "circInOut" }}
            >
              <motion.div
                className="w-full h-full rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: currentLine?.visuals?.speed, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.p
              className="text-white text-3xl font-serif mt-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 1 }}
            >
              {currentLine?.line}
            </motion.p>
          </motion.div>
        )}

        {gameState === 'finished' && (
            <motion.div
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
            >
                <h2 className="text-white text-4xl font-serif mb-6">The End</h2>
                <button
                    onClick={handleReset}
                    className="text-white border-2 border-white rounded-full px-6 py-2 font-sans hover:bg-white hover:text-black transition-colors duration-300"
                >
                    Create Again
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
