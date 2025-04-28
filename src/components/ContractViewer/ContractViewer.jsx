import React, { useState, useEffect, useRef } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ContractInteraction from '../ContractInteraction/ContractInteraction';

function ContractViewer({ contract, network, onSourceChange }) {
  const [sourceCode, setSourceCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' or 'interaction'
  const [lineNumbers, setLineNumbers] = useState([]);
  const editorRef = useRef(null);
  
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
      ) : (
        <div className="flex-grow overflow-auto p-4">
          <ContractInteraction
            contract={contract}
            sourceCode={sourceCode}
            network={network}
          />
        </div>
      )}
    </div>
  );
}

export default ContractViewer;