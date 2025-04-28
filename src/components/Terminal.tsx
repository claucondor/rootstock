
import { useEffect, useState, useRef } from 'react';

const Terminal = () => {
  const [terminalText, setTerminalText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Terminal animation sequence - ahora mostrando texto relacionado con contratos
  useEffect(() => {
    const lines = [
      { text: "$ ", delay: 500 },
      { text: "smart-contract-generator --init", delay: 100, finalDelay: 800 },
      { text: "\n> Inicializando generador de contratos inteligentes...", delay: 50, finalDelay: 500 },
      { text: "\n> Cargando bibliotecas de OpenZeppelin...", delay: 50, finalDelay: 500 },
      { text: "\n> Conectando a la red de Rootstock...", delay: 50, finalDelay: 600 },
      { text: "\n> Compilando modelos de tokens ERC20, ERC721...", delay: 50, finalDelay: 700 },
      { text: "\n> Sistema listo. Conecta tu wallet para comenzar.", delay: 50, finalDelay: 0 }
    ];

    let currentText = '';
    let timeoutId: NodeJS.Timeout;
    let currentLineIndex = 0;
    let currentCharIndex = 0;

    const typeNextChar = () => {
      if (currentLineIndex >= lines.length) {
        setAnimationComplete(true);
        return;
      }

      const currentLine = lines[currentLineIndex];
      
      if (currentCharIndex < currentLine.text.length) {
        currentText += currentLine.text[currentCharIndex];
        setTerminalText(currentText);
        currentCharIndex++;
        
        timeoutId = setTimeout(typeNextChar, currentLine.delay);
      } else {
        currentLineIndex++;
        currentCharIndex = 0;
        timeoutId = setTimeout(typeNextChar, currentLine.finalDelay || 0);
      }

      // Ensure terminal scrolls to bottom as text is added
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    };

    timeoutId = setTimeout(typeNextChar, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  // Cursor blink effect
  useEffect(() => {
    if (animationComplete) {
      const blinkInterval = setInterval(() => {
        setCursorVisible(prev => !prev);
      }, 500);

      return () => clearInterval(blinkInterval);
    }
  }, [animationComplete]);

  return (
    <div className="terminal max-w-2xl mx-auto my-6 opacity-90 animate-fade-in delay-200">
      <div className="terminal-header bg-gray-800 rounded-t-lg border-b border-gray-700 flex items-center px-4 py-2">
        <div className="terminal-button close-button bg-red-500 rounded-full w-3 h-3 mr-2"></div>
        <div className="terminal-button minimize-button bg-yellow-500 rounded-full w-3 h-3 mr-2"></div>
        <div className="terminal-button maximize-button bg-green-500 rounded-full w-3 h-3"></div>
        <div className="ml-auto text-xs text-gray-400">rootstock-contract-generator</div>
      </div>
      <div 
        ref={terminalRef}
        className="terminal-content bg-gray-900 text-green-400 font-mono text-sm md:text-base p-4 rounded-b-lg h-44 overflow-hidden border border-gray-700"
      >
        {terminalText}
        <span className={`cursor ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}>_</span>
      </div>
    </div>
  );
};

export default Terminal;
