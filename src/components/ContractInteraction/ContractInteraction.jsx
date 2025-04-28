import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function ContractInteraction({ contract, sourceCode, network }) {
  const [contractAddress, setContractAddress] = useState('');
  const [functions, setFunctions] = useState([]);
  const [isDeployed, setIsDeployed] = useState(false);
  const [functionResults, setFunctionResults] = useState({});
  const [functionInputs, setFunctionInputs] = useState({});
  const [loading, setLoading] = useState({});

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
      
      functionsList.forEach(func => {
        initialInputs[func.id] = func.inputs.reduce((acc, input) => {
          acc[input.name || `param${input.idx}`] = '';
          return acc;
        }, {});
        
        initialResults[func.id] = null;
      });
      
      setFunctionInputs(initialInputs);
      setFunctionResults(initialResults);
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

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h2 className="text-lg font-semibold">Contract Interaction</h2>
      </div>
      
      <div className="card-body">
        <div className="mb-4">
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

        <div className="space-y-4">
          <h3 className="font-semibold">Functions</h3>
          
          {functions.length === 0 ? (
            <p className="text-muted">No functions found in contract ABI</p>
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
                  </div>
                  
                  <div className="function-body">
                    {func.inputs.length > 0 && (
                      <div className="function-inputs">
                        {func.inputs.map((input, idx) => (
                          <div key={idx} className="function-input-group">
                            <label className="function-input-label">
                              {input.name || `param${idx}`} ({input.type})
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
                    
                    {functionResults[func.id] !== null && (
                      <div className="function-result">
                        <div className="text-xs text-muted mb-1">Result:</div>
                        <div className="break-all">{functionResults[func.id]}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContractInteraction;