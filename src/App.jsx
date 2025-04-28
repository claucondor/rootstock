import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Chat from './components/Chat/Chat';
import ContractViewer from './components/ContractViewer/ContractViewer';
import MetaMaskButton from './components/MetaMaskButton/MetaMaskButton';
import DeployButton from './components/DeployButton/DeployButton';

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Supported networks
const NETWORKS = [
  {
    name: 'RSK Testnet',
    chainId: 31,
    rpcUrl: 'https://public-node.testnet.rsk.co',
    explorer: 'https://explorer.testnet.rsk.co',
    currency: 'tRBTC',
  },
  {
    name: 'RSK Mainnet',
    chainId: 30,
    rpcUrl: 'https://public-node.rsk.co',
    explorer: 'https://explorer.rsk.co',
    currency: 'RBTC',
  },
];

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [network, setNetwork] = useState(NETWORKS[0]);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask no está instalado');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      // Check if connected to correct network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== network.chainId) {
        await switchNetwork(network.chainId);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Switch network in MetaMask
  const switchNetwork = async (chainId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      console.error('Error switching network:', error);
    }
  };

  // Generate contract from prompt
  const generateContract = async (prompt) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Error generating contract');

      const data = await response.json();
      setContract(data);
      setMessages(prev => [...prev, { 
        type: 'contract', 
        content: data,
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error('Generation error:', error);
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: error.message,
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refine existing contract
  const refineContract = async (source, prompt) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, prompt }),
      });

      if (!response.ok) throw new Error('Error refining contract');

      const data = await response.json();
      setContract(data);
      setMessages(prev => [...prev, { 
        type: 'contract', 
        content: data,
        timestamp: new Date().toISOString() 
      }]);
    } catch (error) {
      console.error('Refinement error:', error);
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: error.message,
        timestamp: new Date().toISOString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">RSK Contract Generator</h1>
          <MetaMaskButton 
            account={account} 
            onConnect={connectWallet} 
          />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Chat 
            messages={messages}
            onSend={generateContract}
            onRefine={(source, prompt) => refineContract(source, prompt)}
            isLoading={isLoading}
          />
        </div>

        <div className="space-y-6">
          <ContractViewer 
            contract={contract}
            network={network}
          />
          
          {contract && account && (
            <DeployButton 
              contract={contract}
              account={account}
              network={network}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;