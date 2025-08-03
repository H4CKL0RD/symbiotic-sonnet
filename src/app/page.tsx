"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Torus, Sphere, Dodecahedron, Cone, Cylinder, TorusKnot, Tetrahedron, Box, Octahedron, Capsule } from '@react-three/drei';
import { Color, Group } from 'three';

// --- Type Definitions ---
interface Visual {
  shape: string;
  position: [number, number, number];
  shapeColor: string;
  wireframe: boolean;
}

interface LineData {
  line: string;
  sceneBgColor: string;
  visuals: Visual[];
}

// Helper component to manage the background color safely
function SceneBackground({ color }: { color: string | undefined }) {
  const { scene } = useThree();
  useEffect(() => {
    if (color) {
      scene.background = new Color(color);
    }
  }, [color, scene]);
  return null;
}

// --- Simplified 3D Shape Component (No Physics) ---
function GenerativeShape({ visual }: { visual: Visual }) {
  const meshRef = useRef<Group>(null);

  // Simple rotation animation
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  const materialProps = {
    color: visual.shapeColor,
    wireframe: visual.wireframe,
  };

  return (
    <group position={visual.position} ref={meshRef}>
      {visual.shape === 'icosahedron' && <Icosahedron args={[1.5]}><meshStandardMaterial {...materialProps} /></Icosahedron>}
      {visual.shape === 'torus' && <Torus args={[1, 0.4, 32, 100]}><meshStandardMaterial {...materialProps} /></Torus>}
      {visual.shape === 'sphere' && <Sphere args={[1.5]}><meshStandardMaterial {...materialProps} /></Sphere>}
      {visual.shape === 'dodecahedron' && <Dodecahedron args={[1.5]}><meshStandardMaterial {...materialProps} /></Dodecahedron>}
      {visual.shape === 'cone' && <Cone args={[1, 2, 32]}><meshStandardMaterial {...materialProps} /></Cone>}
      {visual.shape === 'cylinder' && <Cylinder args={[1, 1, 2, 32]}><meshStandardMaterial {...materialProps} /></Cylinder>}
      {visual.shape === 'torusKnot' && <TorusKnot args={[1, 0.4, 128, 16]}><meshStandardMaterial {...materialProps} /></TorusKnot>}
      {visual.shape === 'tetrahedron' && <Tetrahedron args={[1.5]}><meshStandardMaterial {...materialProps} /></Tetrahedron>}
      {visual.shape === 'box' && <Box args={[2, 2, 2]}><meshStandardMaterial {...materialProps} /></Box>}
      {visual.shape === 'octahedron' && <Octahedron args={[1.5]}><meshStandardMaterial {...materialProps} /></Octahedron>}
      {visual.shape === 'capsule' && <Capsule args={[0.5, 1, 32]}><meshStandardMaterial {...materialProps} /></Capsule>}
    </group>
  );
}

// --- Main Page Component ---
export default function SonnetPage() {
  const [gameState, setGameState] = useState('input');
  const [theme, setTheme] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [poemLines, setPoemLines] = useState<LineData[]>([]);

  const fetchLine = useCallback(async (currentTheme: string, history: string[], currentApiKey: string) => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: currentTheme, lineNumber: history.length, history, apiKey: currentApiKey }),
      });
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setPoemLines(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to fetch next line:", error);
      setGameState('input');
    }
  }, []);

  useEffect(() => {
    if (gameState === 'generating' && poemLines.length > 0 && poemLines.length < 4) {
      const timer = setTimeout(() => {
        const history = poemLines.map(p => p.line);
        fetchLine(theme, history, apiKey);
      }, 7000);
      return () => clearTimeout(timer);
    } else if (poemLines.length >= 4) {
      const timer = setTimeout(() => setGameState('finished'), 7000);
      return () => clearTimeout(timer);
    }
  }, [poemLines, gameState, theme, apiKey, fetchLine]);

  const handleStart = () => {
    if (theme.trim() && apiKey.trim()) {
      setPoemLines([]);
      setGameState('generating');
      fetchLine(theme, [], apiKey);
    }
  };

  const handleReset = () => {
    setPoemLines([]);
    setTheme('');
    setGameState('input');
  };

  const currentLine = poemLines[poemLines.length - 1];

  return (
    <div className="w-full h-screen relative">
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
          <Suspense fallback={null}>
            <SceneBackground color={currentLine?.sceneBgColor} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={2.5} />
            <AnimatePresence>
              {poemLines.map((lineData, lineIndex) =>
                lineData.visuals && lineData.visuals.map((visual, visualIndex) => (
                  <GenerativeShape key={`${lineIndex}-${visualIndex}`} visual={visual} />
                ))
              )}
            </AnimatePresence>
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay Container */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AnimatePresence>
          {gameState === 'input' && (
            <motion.div 
              className="w-full h-full flex items-center justify-center pointer-events-auto"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <h1 className="text-white text-5xl font-serif mb-8">Symbiotic Sonnet</h1>
                <div className="space-y-6 max-w-sm mx-auto">
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-transparent border-b-2 border-gray-500 text-white text-2xl text-center focus:outline-none focus:border-white w-full"
                    placeholder="Enter a theme"
                  />
                  <div>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                      className="bg-transparent border-b-2 border-gray-500 text-white text-2xl text-center focus:outline-none focus:border-white w-full"
                      placeholder="Enter Cerebras API Key"
                    />
                    <a 
                      href="https://inference-docs.cerebras.ai/quickstart" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-gray-400 hover:text-white transition-colors mt-2 inline-block"
                    >
                      (Need a key?)
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentLine && gameState !== 'input' && (
            <motion.div 
              className="w-full h-full flex items-center justify-center"
              key={currentLine.line}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
            >
              <p className="text-white text-3xl font-serif text-center max-w-2xl p-4">
                {currentLine.line}
              </p>
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div 
              className="absolute bottom-10 inset-x-0 flex justify-center pointer-events-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <button onClick={handleReset} className="text-white border-2 rounded-full px-6 py-2 hover:bg-white hover:text-black transition-colors">
                Create Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
