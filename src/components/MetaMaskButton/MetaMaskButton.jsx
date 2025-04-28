import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function MetaMaskButton({ account, onConnect }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [chainId, setChainId] = useState(null);

  useEffect(() => {
    if (account) {
      setIsConnected(true);
      checkNetwork();
    } else {
      setIsConnected(false);
    }

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', checkNetwork);
      }
    };
  }, [account]);

  const checkNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chainId, 16));
        
        // Get network name
        let name = 'Unknown Network';
        
        // Common networks
        const networks = {
          1: 'Ethereum Mainnet',
          3: 'Ropsten Testnet',
          4: 'Rinkeby Testnet',
          5: 'Goerli Testnet',
          42: 'Kovan Testnet',
          56: 'BSC Mainnet',
          97: 'BSC Testnet',
          137: 'Polygon Mainnet',
          80001: 'Polygon Mumbai',
          30: 'RSK Mainnet',
          31: 'RSK Testnet',
          42161: 'Arbitrum One',
          421613: 'Arbitrum Goerli',
          10: 'Optimism',
          420: 'Optimism Goerli',
        };
        
        if (networks[parseInt(chainId, 16)]) {
          name = networks[parseInt(chainId, 16)];
        }
        
        setNetworkName(name);
      } catch (err) {
        console.error("Error checking network:", err);
      }
    }
  };

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
      checkNetwork();
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
        <div className="text-danger text-sm mr-2 animate-fade-in">
          {error}
        </div>
      )}
      
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={loading}
          className={`btn ${
            isConnected
              ? 'btn-success'
              : loading
                ? 'btn-gray'
                : 'btn-primary'
          }`}
        >
          {loading ? (
            <span className="flex items-center">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Connecting...
            </span>
          ) : isConnected ? (
            <span className="flex items-center">
              <i className="fa-solid fa-wallet mr-2"></i>
              {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connected'}
            </span>
          ) : (
            <span className="flex items-center">
              <i className="fa-brands fa-ethereum mr-2"></i>
              Connect MetaMask
            </span>
          )}
        </button>
        
        {isConnected && networkName && (
          <div className="absolute top-full right-0 mt-1 text-xs font-medium px-2 py-1 rounded bg-primary bg-opacity-10 text-primary">
            {networkName}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetaMaskButton;