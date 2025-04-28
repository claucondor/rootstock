import React, { useState, useEffect } from 'react';
// Import ethers without the buffer dependency that's causing issues
import { ethers } from 'ethers/lib/ethers';
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
  const [editedSource, setEditedSource] = useState('');

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
    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    }]);
    
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
      setEditedSource(data.source);
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
    // Use the edited source if available
    const sourceToRefine = editedSource || source;
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    }]);
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceToRefine, prompt }),
      });

      if (!response.ok) throw new Error('Error refining contract');

      const data = await response.json();
      setContract(data);
      setEditedSource(data.source);
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

  // Update the edited source code
  const updateSourceCode = (newSource) => {
    setEditedSource(newSource);
    
    // Update the contract object with the new source
    if (contract) {
      setContract({
        ...contract,
        source: newSource
      });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="header">
        <div className="container flex justify-between items-center">
          <div className="flex items-center">
            <i className="fa-solid fa-code text-primary text-2xl mr-2"></i>
            <h1 className="text-2xl font-bold">
              <span className="text-primary">RSK</span> Contract Generator
            </h1>
          </div>
          <MetaMaskButton
            account={account}
            onConnect={connectWallet}
          />
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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
              onSourceChange={updateSourceCode}
            />
            
            {contract && account && (
              <DeployButton
                contract={{
                  ...contract,
                  source: editedSource
                }}
                account={account}
                network={network}
              />
            )}
          </div>
        </div>
      </main>
      
      <footer className="py-4 border-t border-gray-200">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} RSK Smart Contract Generator
            </div>
            <div className="flex space-x-4">
              <a href="https://www.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                <i className="fa-solid fa-globe mr-1"></i> RSK Website
              </a>
              <a href="https://developers.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                <i className="fa-solid fa-code mr-1"></i> Developer Portal
              </a>
              <a href="https://docs.rsk.co/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                <i className="fa-solid fa-book mr-1"></i> Documentation
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;