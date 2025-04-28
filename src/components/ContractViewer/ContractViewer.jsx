import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

function ContractViewer({ contract, network }) {
  const [activeTab, setActiveTab] = useState('source');
  const [copied, setCopied] = useState(false);

  if (!contract) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No contract generated yet. Describe what you need in the chat!
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatABI = (abi) => {
    try {
      // If abi is already an object (array), stringify it directly
      if (typeof abi === 'object') {
        return JSON.stringify(abi, null, 2);
      }
      // If abi is a string, parse it first then stringify with formatting
      return JSON.stringify(JSON.parse(abi), null, 2);
    } catch (error) {
      console.error("Error formatting ABI:", error);
      // If there's an error, return a string representation or empty string
      return typeof abi === 'string' ? abi : '';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Contract Details</h2>
        <div className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
          {network.name}
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('source')}
            className={`py-3 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'source'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Source Code
          </button>
          <button
            onClick={() => setActiveTab('abi')}
            className={`py-3 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'abi'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            ABI
          </button>
          <button
            onClick={() => setActiveTab('bytecode')}
            className={`py-3 px-4 text-center border-b-2 font-medium text-sm ${
              activeTab === 'bytecode'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Bytecode
          </button>
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'source' && (
          <div className="relative">
            <CopyToClipboard text={contract.source} onCopy={handleCopy}>
              <button className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </CopyToClipboard>
            <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-auto text-sm font-mono">
              {contract.source}
            </pre>
          </div>
        )}

        {activeTab === 'abi' && (
          <div className="relative">
            <CopyToClipboard text={formatABI(contract.abi)} onCopy={handleCopy}>
              <button className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </CopyToClipboard>
            <pre className="bg-gray-50 dark:bg-gray-700 p-3 rounded overflow-auto text-sm font-mono">
              {formatABI(contract.abi)}
            </pre>
          </div>
        )}

        {activeTab === 'bytecode' && (
          <div className="relative">
            <CopyToClipboard text={contract.bytecode} onCopy={handleCopy}>
              <button className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </CopyToClipboard>
            <div className="font-mono text-sm break-all bg-gray-50 dark:bg-gray-700 p-3 rounded">
              {contract.bytecode}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Length: {contract.bytecode.length} characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractViewer;