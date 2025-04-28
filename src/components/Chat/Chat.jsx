import React, { useState, useRef, useEffect } from 'react';

function Chat({ messages, onSend, onRefine, isLoading }) {
  const [input, setInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const messagesEndRef = useRef(null);

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Chat with Contract Generator</h2>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${
              message.type === 'user' 
                ? 'bg-blue-500 text-white' 
                : message.type === 'contract'
                  ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                  : 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100'
            }`}>
              {message.type === 'contract' ? (
                <div>
                  <p className="font-medium">Contract generated successfully!</p>
                  <p className="text-xs opacity-75">Click on the contract tab to view details</p>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
              <p className="text-xs opacity-75 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-2">
              <p>Generating contract...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRefining ? "How would you like to refine the contract?" : "Describe the contract you want to create..."}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || !input.trim()}
          >
            {isRefining ? 'Refine' : 'Send'}
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setIsRefining(!isRefining)}
            className={`text-xs px-2 py-1 rounded ${
              isRefining 
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
            disabled={isLoading || messages.filter(m => m.type === 'contract').length === 0}
          >
            {isRefining ? 'Switch to Generate Mode' : 'Switch to Refine Mode'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;