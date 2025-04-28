import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import ContractInteraction from '../ContractInteraction/ContractInteraction';

function ContractViewer({ contract, network, onSourceChange }) {
  const [sourceCode, setSourceCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);

  useEffect(() => {
    if (contract) {
      setSourceCode(contract.source);
    }
  }, [contract]);

  if (!contract) {
    return (
      <div className="card card-body text-center">
        <p className="text-muted">
          No contract generated yet. Describe what you need in the chat!
        </p>
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
    }
  };

  const toggleInteraction = () => {
    setShowInteraction(!showInteraction);
  };

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold">Smart Contract</h2>
          <div className="network-badge">
            {network.name}
          </div>
        </div>

        <div className="tab-content">
          <div className="flex justify-between items-center mb-3">
            <div className="flex space-x-2">
              <button
                onClick={toggleEditing}
                className={`btn btn-sm ${isEditing ? 'btn-primary' : 'btn-gray'}`}
              >
                {isEditing ? (
                  <><i className="fa-solid fa-save mr-1"></i> Save Changes</>
                ) : (
                  <><i className="fa-solid fa-pen-to-square mr-1"></i> Edit Contract</>
                )}
              </button>
              <CopyToClipboard text={sourceCode} onCopy={handleCopy}>
                <button className="btn btn-sm btn-gray">
                  {copied ? (
                    <><i className="fa-solid fa-check mr-1"></i> Copied!</>
                  ) : (
                    <><i className="fa-regular fa-copy mr-1"></i> Copy Code</>
                  )}
                </button>
              </CopyToClipboard>
            </div>
            <button
              onClick={toggleInteraction}
              className="btn btn-sm btn-primary"
            >
              {showInteraction ? (
                <><i className="fa-solid fa-eye-slash mr-1"></i> Hide Interface</>
              ) : (
                <><i className="fa-solid fa-plug mr-1"></i> Show Interface</>
              )}
            </button>
          </div>

          <div className="relative">
            {isEditing ? (
              <textarea
                className="code-editor"
                value={sourceCode}
                onChange={handleSourceChange}
                spellCheck="false"
              />
            ) : (
              <pre>
                <code className="language-solidity">
                  {sourceCode}
                </code>
              </pre>
            )}
          </div>
        </div>
      </div>

      {showInteraction && (
        <ContractInteraction
          contract={contract}
          sourceCode={sourceCode}
          network={network}
        />
      )}
    </div>
  );
}

export default ContractViewer;