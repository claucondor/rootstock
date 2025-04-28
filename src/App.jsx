import React, { useState, useEffect } from 'react';
// Import ethers without the buffer dependency that's causing issues
import { ethers } from 'ethers/lib/ethers';
import Chat from './components/Chat/Chat';
import ContractViewer from './components/ContractViewer/ContractViewer';
import MetaMaskButton from './components/MetaMaskButton/MetaMaskButton';
import DeployButton from './components/DeployButton/DeployButton';
import LandingPage from './components/LandingPage/LandingPage';

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
  const [activeView, setActiveView] = useState('split'); // 'split', 'chat', 'editor'
  const [showLandingPage, setShowLandingPage] = useState(true);

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
    <div className="min-h-screen flex flex-col">
      {showLandingPage ? (
        <LandingPage onGetStarted={() => setShowLandingPage(false)} />
      ) : (
        <>
          <header className="modern-header">
            <div className="container flex justify-between items-center">
              <div className="flex items-center">
                <img
                  src="https://developers.rsk.co/assets/img/rsk_logo.svg"
                  alt="Rootstock Logo"
                  className="h-8 mr-3"
                />
                <h1 className="text-xl md:text-2xl font-bold">
                  <span className="text-primary">Rootstock</span> <span className="text-secondary">Contract Generator</span>
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  className="btn-modern-outline"
                  onClick={() => setShowLandingPage(true)}
                >
                  <i className="fa-solid fa-arrow-left mr-1"></i>
                  Back to Home
                </button>
                <MetaMaskButton
                  account={account}
                  onConnect={connectWallet}
                />
              </div>
            </div>
          </header>

          <main className="container py-6 flex-grow flex flex-col">
            {/* Layout Tabs */}
            <div className="modern-tabs-container mb-6">
              <div className="modern-tabs">
                <button
                  className={`modern-tab ${activeView === 'split' ? 'modern-tab-active' : ''}`}
                  onClick={() => setActiveView('split')}
                >
                  <i className="fa-solid fa-columns mr-2"></i> Split View
                </button>
                <button
                  className={`modern-tab ${activeView === 'chat' ? 'modern-tab-active' : ''}`}
                  onClick={() => setActiveView('chat')}
                >
                  <i className="fa-solid fa-comment-alt mr-2"></i> Chat Only
                </button>
                <button
                  className={`modern-tab ${activeView === 'editor' ? 'modern-tab-active' : ''}`}
                  onClick={() => setActiveView('editor')}
                >
                  <i className="fa-solid fa-code mr-2"></i> Editor Only
                </button>
                {contract && (
                  <button
                    className={`modern-tab ${activeView === 'diagram' ? 'modern-tab-active' : ''}`}
                    onClick={() => setActiveView('diagram')}
                  >
                    <i className="fa-solid fa-project-diagram mr-2"></i> Contract Diagram
                  </button>
                )}
              </div>
            </div>
            
            {/* Main Content Area with Resizable Panels */}
            <div className="flex flex-col lg:flex-row gap-6 flex-grow modern-content-area">
              {/* Left Panel - Chat */}
              {(activeView === 'split' || activeView === 'chat') && (
                <div className={`flex flex-col ${activeView === 'split' ? 'lg:w-1/2' : 'w-full'}`}>
                  <Chat
                    messages={messages}
                    onSend={generateContract}
                    onRefine={(source, prompt) => refineContract(source, prompt)}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Right Panel - Contract Editor & Tools */}
              {(activeView === 'split' || activeView === 'editor') && (
                <div className={`flex flex-col ${activeView === 'split' ? 'lg:w-1/2' : 'w-full'}`}>
                  <div className="flex-grow">
                    <ContractViewer
                      contract={contract}
                      network={network}
                      onSourceChange={updateSourceCode}
                    />
                  </div>
                  
                  {contract && account && (
                    <div className="mt-4">
                      <DeployButton
                        contract={{
                          ...contract,
                          source: editedSource
                        }}
                        account={account}
                        network={network}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Contract Diagram View */}
              {activeView === 'diagram' && contract && (
                <div className="w-full flex flex-col">
                  <div className="card h-full flex flex-col overflow-hidden">
                    <div className="card-header flex justify-between items-center">
                      <h2 className="text-lg font-semibold">Contract Diagram</h2>
                      <div className="network-badge">
                        {network.name}
                      </div>
                    </div>
                    <div className="flex-grow p-4 overflow-auto">
                      {contract.diagramData ? (
                        <div className="space-y-6">
                          {/* Diagram explanation */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h3 className="text-xl font-semibold mb-2">Contract Architecture</h3>
                            <p className="mb-4">{contract.diagramData.explanation}</p>
                          </div>
                          
                          {/* Diagram visualization */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 text-center">Visual Representation</h3>
                            
                            <div className="diagram-container" style={{ minHeight: '400px' }}>
                              {/* This is a simplified representation - in a real app, you would use ReactFlow */}
                              <div className="flex flex-wrap justify-center gap-6 mb-8">
                                {contract.diagramData.nodes.map(node => (
                                  <div 
                                    key={node.id} 
                                    className={`p-3 rounded-lg border shadow-sm ${
                                      node.type === 'contract' ? 'bg-blue-50 border-blue-200' :
                                      node.type === 'function' ? 'bg-green-50 border-green-200' :
                                      node.type === 'storage' ? 'bg-yellow-50 border-yellow-200' :
                                      'bg-gray-50 border-gray-200'
                                    }`}
                                    style={{ minWidth: '150px' }}
                                  >
                                    <div className="text-xs font-semibold uppercase text-gray-500 mb-1">{node.type}</div>
                                    <div className="text-sm font-medium">{node.data?.label}</div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Relationships */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <h4 className="font-semibold mb-3">Relationships:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {contract.diagramData.edges.map(edge => (
                                    <div key={edge.id} className="p-2 border-b border-gray-100 flex items-center">
                                      <span className="font-medium text-blue-600">{edge.source}</span>
                                      <i className="fa-solid fa-arrow-right mx-2 text-gray-400"></i>
                                      <span className="font-medium text-green-600">{edge.target}</span>
                                      {edge.label && (
                                        <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                          {edge.label}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-xs text-center text-muted mt-6">
                              Note: For a fully interactive diagram, consider integrating ReactFlow in your application
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-6 text-center h-full flex flex-col items-center justify-center">
                          <i className="fa-solid fa-project-diagram text-primary text-5xl mb-4"></i>
                          <h3 className="text-xl font-semibold mb-2">Contract Visualization</h3>
                          <p className="text-muted mb-4">
                            A visual representation of your smart contract will be displayed here.
                            This diagram will show the relationships between functions, state variables, and events.
                          </p>
                          <div className="border border-dashed border-gray-300 rounded-lg p-8 w-full max-w-2xl">
                            <p className="text-muted">Contract diagram will be generated here</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
          
          <footer className="modern-footer">
            <div className="container">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0 flex items-center">
                  <img
                    src="https://developers.rsk.co/assets/img/rsk_logo.svg"
                    alt="Rootstock Logo"
                    className="h-6 mr-3"
                  />
                  <div>
                    <p className="text-sm text-gray-600">
                      &copy; {new Date().getFullYear()} Rootstock Smart Contract Generator
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Building the future of smart contracts on Bitcoin
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  <a href="https://www.rsk.co/" target="_blank" rel="noopener noreferrer" className="footer-link">
                    <i className="fa-solid fa-globe mr-1"></i> Website
                  </a>
                  <a href="https://developers.rsk.co/" target="_blank" rel="noopener noreferrer" className="footer-link">
                    <i className="fa-solid fa-code mr-1"></i> Developer Portal
                  </a>
                  <a href="https://docs.rsk.co/" target="_blank" rel="noopener noreferrer" className="footer-link">
                    <i className="fa-solid fa-book mr-1"></i> Documentation
                  </a>
                  <a href="https://explorer.rsk.co/" target="_blank" rel="noopener noreferrer" className="footer-link">
                    <i className="fa-solid fa-search mr-1"></i> Explorer
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;