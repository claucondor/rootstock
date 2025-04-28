import React, { useState, useEffect, useRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ContractInteraction from '../ContractInteraction/ContractInteraction';

function ContractViewer({ contract, network, onSourceChange }) {
  const [sourceCode, setSourceCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code', 'interaction', or 'docs'
  const [lineNumbers, setLineNumbers] = useState([]);
  const editorRef = useRef(null);
  const [contractDocs, setContractDocs] = useState(null);
  const [diagramData, setDiagramData] = useState(null);
  
  // Generate line numbers for the code
  useEffect(() => {
    if (sourceCode) {
      const lines = sourceCode.split('\n');
      setLineNumbers(Array.from({ length: lines.length }, (_, i) => i + 1));
    } else {
      setLineNumbers([]);
    }
  }, [sourceCode]);

  useEffect(() => {
    if (contract) {
      setSourceCode(contract.source);
      
      // Set diagram data if available
      if (contract.diagramData) {
        setDiagramData(contract.diagramData);
      } else {
        setDiagramData(null);
      }
      
      // Generate documentation for the contract
      // Use function descriptions from backend if available
      setContractDocs({
        title: contract.name || "Smart Contract",
        description: "This smart contract was generated based on your requirements. It implements the functionality you requested with security best practices.",
        sections: [
          {
            title: "Overview",
            content: "This contract provides a secure and efficient implementation of the requested functionality. It follows the latest standards and best practices in smart contract development."
          },
          {
            title: "Security Considerations",
            content: "The contract includes protections against common vulnerabilities such as reentrancy attacks, integer overflow/underflow, and unauthorized access. Always ensure proper testing before deployment to production."
          },
          {
            title: "Usage Guide",
            content: "To use this contract, deploy it to the blockchain of your choice, then interact with its functions using a web3 provider like MetaMask or a custom dApp interface."
          },
          ...(contract.functionDescriptions ? [{
            title: "Function Reference",
            content: "Detailed descriptions of each function in this contract:",
            functionDescriptions: contract.functionDescriptions
          }] : [])
        ]
      });
    }
  }, [contract]);

  // Handle tab key in editor
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Insert 2 spaces at cursor position
      const newValue = sourceCode.substring(0, start) + '  ' + sourceCode.substring(end);
      setSourceCode(newValue);
      
      // Move cursor after the inserted tab
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
      
      if (onSourceChange) {
        onSourceChange(newValue);
      }
    }
  };

  if (!contract) {
    return (
      <div className="card h-full flex flex-col justify-center items-center p-6">
        <div className="text-center">
          <i className="fa-solid fa-code text-primary text-4xl mb-4"></i>
          <p className="text-muted">
            No contract generated yet. Describe what you need in the chat!
          </p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSourceChange = (e) => {
    const newSource = e.target.value;
    setSourceCode(newSource);
    if (onSourceChange) {
      onSourceChange(newSource);
    }
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    
    // If we're exiting edit mode, make sure the source is updated
    if (isEditing && onSourceChange) {
      onSourceChange(sourceCode);
    } else if (!isEditing) {
      // Focus the editor when entering edit mode
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 0);
    }
  };

  const toggleInteraction = () => {
    setShowInteraction(!showInteraction);
  };

  return (
    <div className="card h-full flex flex-col overflow-hidden">
      <div className="card-header flex justify-between items-center">
        <h2 className="text-lg font-semibold">Smart Contract</h2>
        <div className="network-badge">
          {network.name}
        </div>
      </div>

      {/* Tabs for Code and Interaction */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'code' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <i className="fa-solid fa-code mr-1"></i> Code
        </button>
        <button
          className={`tab ${activeTab === 'interaction' ? 'tab-active' : ''}`}
          onClick={() => {
            setActiveTab('interaction');
            setShowInteraction(true);
          }}
        >
          <i className="fa-solid fa-plug mr-1"></i> Interaction
        </button>
        <button
          className={`tab ${activeTab === 'docs' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          <i className="fa-solid fa-book mr-1"></i> Documentation
        </button>
      </div>

      {activeTab === 'code' ? (
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="flex space-x-2">
              <button
                onClick={toggleEditing}
                className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-gray'}`}
              >
                {isEditing ? (
                  <><i className="fa-solid fa-save mr-1"></i> Save</>
                ) : (
                  <><i className="fa-solid fa-pen-to-square mr-1"></i> Edit</>
                )}
              </button>
              <CopyToClipboard text={sourceCode} onCopy={handleCopy}>
                <button className="btn btn-sm btn-gray">
                  {copied ? (
                    <><i className="fa-solid fa-check mr-1"></i> Copied</>
                  ) : (
                    <><i className="fa-regular fa-copy mr-1"></i> Copy</>
                  )}
                </button>
              </CopyToClipboard>
            </div>
            <div className="text-xs text-muted">
              {lineNumbers.length} lines
            </div>
          </div>

          <div className="flex-grow overflow-auto relative">
            {isEditing ? (
              <div className="code-editor-container">
                <div className="line-numbers">
                  {lineNumbers.map(num => (
                    <div key={num} className="line-number">{num}</div>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  className="code-editor with-line-numbers"
                  value={sourceCode}
                  onChange={handleSourceChange}
                  onKeyDown={handleKeyDown}
                  spellCheck="false"
                />
              </div>
            ) : (
              <div className="code-display-container">
                <div className="line-numbers">
                  {lineNumbers.map(num => (
                    <div key={num} className="line-number">{num}</div>
                  ))}
                </div>
                <pre className="code-display">
                  <code className="language-solidity">
                    {sourceCode}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'interaction' ? (
        <div className="flex-grow overflow-auto p-4">
          <ContractInteraction
            contract={contract}
            sourceCode={sourceCode}
            network={network}
          />
        </div>
      ) : (
        <div className="flex-grow overflow-auto p-4">
          {contractDocs ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">{contractDocs.title}</h2>
                <p className="text-muted">{contractDocs.description}</p>
              </div>
              
              {contractDocs.sections.map((section, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                  <p>{section.content}</p>
                  
                  {/* Display function descriptions if available */}
                  {section.functionDescriptions && (
                    <div className="mt-4 space-y-3">
                      {Object.entries(section.functionDescriptions).map(([funcName, description]) => (
                        <div key={funcName} className="bg-white rounded p-3 border border-gray-200">
                          <h4 className="font-mono text-primary font-medium mb-1">{funcName}</h4>
                          <p className="text-sm">{description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="bg-primary bg-opacity-5 rounded-lg p-4 border border-primary border-opacity-20">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <i className="fa-solid fa-project-diagram text-primary mr-2"></i>
                  Contract Diagram
                </h3>
                <p className="mb-4">Visual representation of your contract structure:</p>
                
                {diagramData ? (
                  <div className="space-y-4">
                    {/* Diagram explanation */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold mb-2">Diagram Explanation</h4>
                      <p>{diagramData.explanation}</p>
                    </div>
                    
                    {/* Simple diagram visualization */}
                    <div className="border border-gray-300 rounded-lg p-4 bg-white">
                      <div className="diagram-container" style={{ minHeight: '300px' }}>
                        {/* This is a simplified representation - in a real app, you would use ReactFlow */}
                        <div className="text-center mb-4">
                          <p className="text-sm text-muted mb-2">Contract Structure Visualization</p>
                          <div className="flex flex-wrap justify-center gap-4">
                            {diagramData.nodes.map(node => (
                              <div
                                key={node.id}
                                className={`p-2 rounded-lg border ${
                                  node.type === 'contract' ? 'bg-blue-50 border-blue-200' :
                                  node.type === 'function' ? 'bg-green-50 border-green-200' :
                                  node.type === 'storage' ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="text-xs font-semibold">{node.type}</div>
                                <div className="text-sm">{node.data?.label}</div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Simple representation of edges */}
                          <div className="mt-4">
                            <h5 className="text-sm font-semibold mb-2">Relationships:</h5>
                            <ul className="text-sm">
                              {diagramData.edges.map(edge => (
                                <li key={edge.id} className="mb-1">
                                  <span className="font-medium">{edge.source}</span>
                                  {edge.label && <span className="mx-1">({edge.label})</span>}
                                  <i className="fa-solid fa-arrow-right mx-1 text-xs"></i>
                                  <span className="font-medium">{edge.target}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <p className="text-xs text-center text-muted mt-4">
                          Note: For a fully interactive diagram, consider integrating ReactFlow in your application
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <i className="fa-solid fa-project-diagram text-primary text-4xl mb-4"></i>
                    <p className="text-muted">Contract diagram will be displayed here</p>
                    <p className="text-xs text-muted mt-2">
                      The diagram will show the relationships between functions, state variables, and events
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-primary text-2xl mb-2"></i>
                <p>Loading documentation...</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContractViewer;