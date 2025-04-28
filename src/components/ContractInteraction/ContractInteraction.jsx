import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function ContractInteraction({ contract, sourceCode, network }) {
  const [contractAddress, setContractAddress] = useState('');
  const [functions, setFunctions] = useState([]);
  const [isDeployed, setIsDeployed] = useState(false);
  const [functionResults, setFunctionResults] = useState({});
  const [functionInputs, setFunctionInputs] = useState({});
  const [loading, setLoading] = useState({});
  const [expandedFunction, setExpandedFunction] = useState(null);
  const [viewMode, setViewMode] = useState('standard'); // 'standard', 'educational'
  
  // Mock explanations for functions (in a real app, these would come from the backend)
  const [functionExplanations, setFunctionExplanations] = useState({});

  useEffect(() => {
    if (contract && contract.abi) {
      parseABI(contract.abi);
    }
  }, [contract]);

  const parseABI = (abi) => {
    try {
      // Parse ABI if it's a string
      const parsedABI = typeof abi === 'string' ? JSON.parse(abi) : abi;
      
      // Filter out functions (exclude events, constructors, etc.)
      const functionsList = parsedABI.filter(item =>
        item.type === 'function'
      ).map(func => ({
        ...func,
        id: `${func.name}_${func.inputs.map(input => input.type).join('_')}`
      }));
      
      setFunctions(functionsList);
      
      // Initialize inputs for each function
      const initialInputs = {};
      const initialResults = {};
      const explanations = {};
      
      functionsList.forEach(func => {
        initialInputs[func.id] = func.inputs.reduce((acc, input) => {
          acc[input.name || `param${input.idx}`] = '';
          return acc;
        }, {});
        
        initialResults[func.id] = null;
        
        // Use function descriptions from backend if available, otherwise generate explanations
        const functionDescription = contract.functionDescriptions?.[func.name];
        
        explanations[func.id] = {
          purpose: functionDescription ||
            `This function ${func.name} is used to ${func.name.startsWith('get') ? 'retrieve' : 'modify'} data in the contract.`,
          params: func.inputs.map(input => ({
            name: input.name || `param${input.idx}`,
            description: `A ${input.type} value that represents ${input.name || 'a parameter'}.`,
            example: getExampleValue(input.type)
          })),
          returns: func.outputs.length > 0 ? {
            description: `Returns ${func.outputs.map(o => o.type).join(', ')}`,
            example: func.outputs.map(o => getExampleValue(o.type)).join(', ')
          } : null,
          security: func.stateMutability === 'view' ?
            'This is a read-only function and does not modify the blockchain state.' :
            'This function modifies the blockchain state and requires a transaction to be sent.',
          gasEstimate: func.stateMutability !== 'view' ? '~50,000 gas units (varies)' : 'No gas cost (view function)'
        };
      });
      
      setFunctionInputs(initialInputs);
      setFunctionResults(initialResults);
      setFunctionExplanations(explanations);
    } catch (error) {
      console.error("Error parsing ABI:", error);
    }
  };

  const handleInputChange = (funcId, paramName, value) => {
    setFunctionInputs(prev => ({
      ...prev,
      [funcId]: {
        ...prev[funcId],
        [paramName]: value
      }
    }));
  };

  const callFunction = async (func) => {
    if (!isDeployed || !contractAddress) {
      alert('Contract is not deployed yet. Please deploy the contract first.');
      return;
    }

    setLoading(prev => ({ ...prev, [func.id]: true }));
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const contractInstance = new ethers.Contract(
        contractAddress,
        contract.abi,
        func.stateMutability === 'view' ? provider : signer
      );
      
      // Get the parameters for this function
      const params = func.inputs.map(input => 
        functionInputs[func.id][input.name || `param${input.idx}`]
      );
      
      // Call the function
      let result;
      if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
        result = await contractInstance[func.name](...params);
      } else {
        const tx = await contractInstance[func.name](...params);
        await tx.wait();
        result = 'Transaction successful';
      }
      
      // Format the result
      let formattedResult = result;
      if (ethers.BigNumber && result instanceof ethers.BigNumber) {
        formattedResult = result.toString();
      } else if (Array.isArray(result)) {
        formattedResult = JSON.stringify(result);
      } else if (typeof result === 'object' && result !== null) {
        formattedResult = JSON.stringify(result);
      }
      
      setFunctionResults(prev => ({
        ...prev,
        [func.id]: formattedResult
      }));
    } catch (error) {
      console.error(`Error calling function ${func.name}:`, error);
      setFunctionResults(prev => ({
        ...prev,
        [func.id]: `Error: ${error.message || 'Unknown error'}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, [func.id]: false }));
    }
  };

  const setDeployedAddress = (address) => {
    if (ethers.isAddress(address)) {
      setContractAddress(address);
      setIsDeployed(true);
    } else {
      alert('Please enter a valid Ethereum address');
    }
  };

  // Helper function to generate example values based on type
  const getExampleValue = (type) => {
    if (type.includes('uint')) return '42';
    if (type.includes('int')) return '-10';
    if (type.includes('bool')) return 'true';
    if (type.includes('address')) return '0x123...abc';
    if (type.includes('string')) return '"example"';
    if (type.includes('bytes')) return '0xabcdef';
    return 'example';
  };

  const toggleFunctionExpand = (funcId) => {
    if (expandedFunction === funcId) {
      setExpandedFunction(null);
    } else {
      setExpandedFunction(funcId);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex-grow">
          <label className="block text-sm font-medium mb-1">Contract Address</label>
          <div className="flex space-x-2">
            <input
              type="text"
              className="form-input"
              placeholder="Enter deployed contract address"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              disabled={isDeployed}
            />
            {!isDeployed ? (
              <button
                className="btn btn-primary"
                onClick={() => setDeployedAddress(contractAddress)}
                disabled={!contractAddress}
              >
                <i className="fa-solid fa-plug mr-1"></i> Connect
              </button>
            ) : (
              <button
                className="btn btn-gray"
                onClick={() => {
                  setIsDeployed(false);
                  setContractAddress('');
                }}
              >
                <i className="fa-solid fa-unlink mr-1"></i> Disconnect
              </button>
            )}
          </div>
          {!isDeployed && (
            <p className="text-xs text-muted mt-1">
              Deploy your contract first, then enter the address to interact with it
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted">View Mode:</span>
          <div className="tabs tabs-sm">
            <button
              className={`tab ${viewMode === 'standard' ? 'tab-active' : ''}`}
              onClick={() => setViewMode('standard')}
            >
              Standard
            </button>
            <button
              className={`tab ${viewMode === 'educational' ? 'tab-active' : ''}`}
              onClick={() => setViewMode('educational')}
            >
              Educational
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        <h3 className="font-semibold mb-3">Contract Functions</h3>
        
        {functions.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <i className="fa-solid fa-code text-muted text-2xl mb-2"></i>
            <p className="text-muted">No functions found in contract ABI</p>
          </div>
        ) : (
          <div className="space-y-4">
            {functions.map((func) => (
              <div key={func.id} className="function-card">
                <div className="function-header">
                  <div className="flex items-center space-x-2">
                    <span>{func.name}</span>
                    <span className={`badge ${
                      func.stateMutability === 'view' || func.stateMutability === 'pure'
                        ? 'badge-view'
                        : func.stateMutability === 'payable'
                          ? 'badge-payable'
                          : 'badge-nonpayable'
                    }`}>
                      {func.stateMutability}
                    </span>
                  </div>
                  
                  {viewMode === 'educational' && (
                    <button
                      className="text-xs text-primary"
                      onClick={() => toggleFunctionExpand(func.id)}
                    >
                      {expandedFunction === func.id ? (
                        <><i className="fa-solid fa-chevron-up mr-1"></i> Hide Details</>
                      ) : (
                        <><i className="fa-solid fa-chevron-down mr-1"></i> Show Details</>
                      )}
                    </button>
                  )}
                </div>
                
                {viewMode === 'educational' && expandedFunction === func.id && (
                  <div className="p-3 bg-primary bg-opacity-5 border-t border-b border-primary border-opacity-20">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-1">Purpose</h4>
                      <p className="text-sm">{functionExplanations[func.id]?.purpose}</p>
                      
                      {/* If the purpose is from the backend (not auto-generated), show a badge */}
                      {contract.functionDescriptions?.[func.name] && (
                        <div className="mt-1">
                          <span className="inline-block bg-primary bg-opacity-10 text-primary text-xs px-2 py-1 rounded-full">
                            <i className="fa-solid fa-check-circle mr-1"></i> AI-Generated Description
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {functionExplanations[func.id]?.params.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-1">Parameters</h4>
                        <div className="space-y-2">
                          {functionExplanations[func.id].params.map((param, idx) => (
                            <div key={idx} className="text-sm">
                              <span className="font-mono font-medium">{param.name}</span>: {param.description}
                              <div className="text-xs text-muted mt-1">Example: <span className="font-mono">{param.example}</span></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {functionExplanations[func.id]?.returns && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold mb-1">Returns</h4>
                        <p className="text-sm">{functionExplanations[func.id].returns.description}</p>
                        <div className="text-xs text-muted mt-1">Example: <span className="font-mono">{functionExplanations[func.id].returns.example}</span></div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Security</h4>
                        <p className="text-sm">{functionExplanations[func.id]?.security}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Gas Estimate</h4>
                        <p className="text-sm">{functionExplanations[func.id]?.gasEstimate}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="function-body">
                  {func.inputs.length > 0 && (
                    <div className="function-inputs">
                      {func.inputs.map((input, idx) => (
                        <div key={idx} className="function-input-group">
                          <label className="function-input-label">
                            {input.name || `param${idx}`} ({input.type})
                            {viewMode === 'educational' && (
                              <span className="ml-2 text-xs text-primary">
                                Example: {getExampleValue(input.type)}
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder={`Enter ${input.type}`}
                            value={functionInputs[func.id][input.name || `param${idx}`] || ''}
                            onChange={(e) => handleInputChange(
                              func.id,
                              input.name || `param${idx}`,
                              e.target.value
                            )}
                            disabled={!isDeployed || loading[func.id]}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <button
                      className={`btn ${
                        func.stateMutability === 'view' || func.stateMutability === 'pure'
                          ? 'btn-primary'
                          : func.stateMutability === 'payable'
                            ? 'btn-success'
                            : 'btn-gray'
                      }`}
                      onClick={() => callFunction(func)}
                      disabled={!isDeployed || loading[func.id]}
                    >
                      {loading[func.id] ? (
                        <span className="flex items-center">
                          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          {func.stateMutability === 'view' || func.stateMutability === 'pure' ? (
                            <i className="fa-solid fa-magnifying-glass mr-1"></i>
                          ) : func.stateMutability === 'payable' ? (
                            <i className="fa-solid fa-coins mr-1"></i>
                          ) : (
                            <i className="fa-solid fa-play mr-1"></i>
                          )}
                          Call {func.name}
                        </span>
                      )}
                    </button>
                    
                    {viewMode === 'educational' && (
                      <div className="text-xs text-muted">
                        {func.stateMutability === 'view' || func.stateMutability === 'pure'
                          ? 'Read-only function, no gas cost'
                          : 'State-changing function, requires gas'}
                      </div>
                    )}
                  </div>
                  
                  {functionResults[func.id] !== null && (
                    <div className="function-result">
                      <div className="text-xs text-muted mb-1">Result:</div>
                      <div className="break-all">{functionResults[func.id]}</div>
                      
                      {viewMode === 'educational' && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="font-semibold mb-1">Understanding the result:</div>
                          <p>
                            This is the {func.stateMutability === 'view' || func.stateMutability === 'pure'
                              ? 'value returned by the function'
                              : 'transaction result'}.
                            {func.stateMutability !== 'view' && func.stateMutability !== 'pure' &&
                              ' The actual state change has been recorded on the blockchain.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ContractInteraction;