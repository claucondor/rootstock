import React, { useState, useRef, useEffect } from 'react';

function Chat({ messages, onSend, onRefine, isLoading }) {
  const [input, setInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const messagesEndRef = useRef(null);
  const [placeholder, setPlaceholder] = useState('');
  const placeholders = [
    "Create an ERC20 token with a fixed supply...",
    "I need a voting contract for my DAO...",
    "Create a simple NFT collection with 10,000 items...",
    "I need a staking contract for my token...",
    "Create a multisig wallet contract..."
  ];

  useEffect(() => {
    const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    setPlaceholder(isRefining
      ? "Enter your refinements for the contract..."
      : randomPlaceholder);
  }, [isRefining]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');

    if (isRefining) {
      // Find the last contract message to refine
      const lastContract = [...messages].reverse().find(m => m.type === 'contract');
      if (lastContract) {
        onRefine(lastContract.content.source, userMessage);
      }
    } else {
      onSend(userMessage);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h2 className="text-lg font-semibold">Smart Contract Generator</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted">
            {isRefining ? 'Refine Mode' : 'Generate Mode'}
          </span>
          <label className="switch">
            <input
              type="checkbox"
              checked={isRefining}
              onChange={() => setIsRefining(!isRefining)}
              className="sr-only"
              disabled={isLoading || messages.filter(m => m.type === 'contract').length === 0}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <i className="fa-solid fa-code-branch text-muted text-5xl mb-4"></i>
            <h3 className="text-lg font-medium mb-2">Welcome to RSK Contract Generator</h3>
            <p className="text-muted mb-4">
              Describe the smart contract you want to create, and our AI will generate it for you.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {placeholders.map((suggestion, index) => (
                <button
                  key={index}
                  className="text-left text-sm p-2 border border-primary border-opacity-20 rounded-md hover:bg-primary hover:bg-opacity-5"
                  onClick={() => setInput(suggestion.replace('...', ''))}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`message ${
                  message.type === 'user'
                    ? 'message-user'
                    : message.type === 'contract'
                      ? 'message-contract'
                      : 'message-error'
                }`}>
                  {message.type === 'contract' ? (
                    <div>
                      <p className="font-medium">Contract generated successfully!</p>
                      <p className="text-xs opacity-75">You can now edit and deploy your contract</p>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <p className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="message animate-pulse">
                  <div className="flex items-center">
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    <p>Generating smart contract...</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="card-footer">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="form-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : isRefining ? (
              <>
                <i className="fa-solid fa-wand-magic-sparkles mr-1"></i> Refine
              </>
            ) : (
              <>
                <i className="fa-solid fa-bolt mr-1"></i> Generate
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;