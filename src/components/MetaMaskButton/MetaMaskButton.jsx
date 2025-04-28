import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function MetaMaskButton({ account, onConnect }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [account]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to continue.');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      onConnect(accounts[0]);
      setIsConnected(true);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center">
      {error && (
        <div className="text-red-500 text-sm mr-2">
          {error}
        </div>
      )}
      <button
        onClick={handleConnect}
        disabled={loading || isConnected}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          isConnected
            ? 'bg-green-500 text-white cursor-default'
            : loading
              ? 'bg-gray-500 text-white cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {loading ? (
          <span>Connecting...</span>
        ) : isConnected ? (
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </span>
        ) : (
          <span className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Connect MetaMask
          </span>
        )}
      </button>
    </div>
  );
}

export default MetaMaskButton;