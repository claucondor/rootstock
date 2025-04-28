import { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';

// Array of humorous loading messages
const GENERATION_MESSAGES = [
  "Convincing the blockchain this is a good idea...",
  "Teaching smart contracts to be smarter...",
  "Bribing gas fees with virtual cookies...",
  "Negotiating with solidity compiler...",
  "Asking ChatGPT for relationship advice...",
  "Converting coffee into code...",
  "Downloading more RAM...",
  "Consulting the ancient scrolls of Ethereum...",
  "Summoning Vitalik's wisdom...",
  "Reticulating smart contract splines...",
  "Mining imagination blocks...",
  "Generating random excuses for high gas fees...",
  "Teaching IPFS to forget things (unsuccessfully)...",
  "Calculating optimal meme integration...",
  "Debugging quantum entangled functions...",
  "Applying blockchain moisturizer...",
  "Feeding the smart contract hamsters...",
  "Downloading Web4 beta...",
  "Optimizing virtual machine daydreams...",
  "Compiling hopes and dreams...",
  "Searching for missing semicolons...",
  "Asking AI to be less artificial...",
  "Generating random randomness randomly...",
  "Teaching smart contracts about love...",
  "Calculating gas fees in unicorn tears...",
  "Consulting the crypto crystal ball...",
  "Upgrading blockchain firmware...",
  "Downloading more blockchain...",
  "Solving P vs NP (just kidding)...",
  "Making coffee for the virtual machines..."
];

interface GenerationConsoleProps {
  isGenerating: boolean;
  progress?: number; // 0-100
  className?: string;
}

const GenerationConsole = ({ isGenerating, progress = 0, className = '' }: GenerationConsoleProps) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Reset and start generating new messages when isGenerating changes
  useEffect(() => {
    if (isGenerating) {
      setMessages([getRandomMessage()]);
      const interval = setInterval(() => {
        setMessages(prev => {
          // Keep max 5 messages in the console
          const newMessages = [...prev];
          if (newMessages.length >= 5) {
            newMessages.shift();
          }
          newMessages.push(getRandomMessage());
          return newMessages;
        });
      }, 3000); // New message every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Get a random message, ensuring it's different from the last one
  const getRandomMessage = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * GENERATION_MESSAGES.length);
    } while (newIndex === currentMessageIndex && GENERATION_MESSAGES.length > 1);
    
    setCurrentMessageIndex(newIndex);
    return GENERATION_MESSAGES[newIndex];
  };

  // Render nothing if not generating
  if (!isGenerating && messages.length === 0) {
    return null;
  }

  return (
    <div className={`font-mono text-sm rounded-md bg-gray-950 border border-gray-800 ${className}`}>
      <div className="flex items-center p-2 border-b border-gray-800 bg-gray-900">
        <Terminal className="w-4 h-4 mr-2 text-green-500" />
        <span className="text-green-500 font-semibold">Generation Console</span>
        {progress > 0 && (
          <div className="ml-auto text-xs text-gray-400">{progress}% complete</div>
        )}
      </div>
      <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className="flex">
            <span className="text-green-500 mr-2">$</span>
            <span className="text-gray-300">
              {message}
              {index === messages.length - 1 && (
                <span className="inline-block w-2 h-4 ml-1 bg-green-500 animate-pulse"></span>
              )}
            </span>
          </div>
        ))}
        
        {isGenerating && progress > 0 && (
          <div className="mt-2 w-full bg-gray-800 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationConsole; 