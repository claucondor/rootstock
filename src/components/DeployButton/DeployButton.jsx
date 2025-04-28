import React, { useState } from 'react';
import { ethers } from 'ethers';

function DeployButton({ contract, account, network }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deployedAddress, setDeployedAddress] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setDeployedAddress('');
    setTxHash('');

    try {
      if (!contract) {
        throw new Error('No contract to deploy');
      }

      if (!account) {
        throw new Error('No account connected');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factory = new ethers.ContractFactory(
        contract.abi,
        contract.bytecode,
        signer
      );

      const deployedContract = await factory.deploy();
      const tx = deployedContract.deploymentTransaction();
      setTxHash(tx.hash);
      
      await deployedContract.waitForDeployment();
      const address = await deployedContract.getAddress();
      
      setDeployedAddress(address);
      setSuccess(true);
    } catch (err) {
      console.error("Deployment error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (hash) => {
    return `${network.explorer}/tx/${hash}`;
  };

  const getAddressExplorerUrl = (address) => {
    return `${network.explorer}/address/${address}`;
  };

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h2 className="text-lg font-semibold">Deploy Contract</h2>
      </div>
      
      <div className="card-body">
        <p className="text-sm mb-4">
          Deploy your smart contract to the {network.name} blockchain.
          You'll need {network.currency} in your wallet to pay for gas fees.
        </p>
        
        <button
          onClick={handleDeploy}
          disabled={loading || !contract || !account}
          className={`btn w-full ${
            loading
              ? 'btn-gray'
              : !contract || !account
                ? 'btn-gray'
                : 'btn-success'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Deploying...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <i className="fa-solid fa-rocket mr-2"></i>
              Deploy Contract
            </span>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-danger bg-opacity-10 text-danger text-sm rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}

        {txHash && (
          <div className="mt-4">
            <p className="text-sm font-medium">Transaction Hash:</p>
            <div className="flex items-center mt-1">
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary break-all hover:underline"
              >
                {txHash}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="ml-2 text-xs text-muted hover:text-primary"
                title="Copy to clipboard"
              >
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>
        )}

        {success && deployedAddress && (
          <div className="mt-4 p-4 bg-success bg-opacity-10 text-success rounded-lg animate-fade-in">
          <div className="flex items-center mb-2">
            <i className="fa-solid fa-circle-check mr-2"></i>
            <strong>Contract deployed successfully!</strong>
          </div>
            
            <p className="text-sm font-medium mt-2">Contract Address:</p>
            <div className="flex items-center mt-1">
              <a
                href={getAddressExplorerUrl(deployedAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm break-all hover:underline"
              >
                {deployedAddress}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(deployedAddress)}
                className="ml-2 text-xs hover:text-primary"
                title="Copy to clipboard"
              >
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
            
            <p className="text-sm mt-3">
              Use this address in the Contract Interaction section to interact with your deployed contract.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeployButton;