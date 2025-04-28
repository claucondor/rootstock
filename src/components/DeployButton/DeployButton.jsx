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
    <div className="deploy-card">
      <div className="deploy-card-header">
        <div className="flex items-center">
          <div className="deploy-icon-container mr-3">
            <i className="fa-solid fa-rocket"></i>
          </div>
          <h2 className="text-lg font-bold">Deploy Contract</h2>
        </div>
        <div className="network-badge-modern">
          <span className="network-dot"></span>
          {network.name}
        </div>
      </div>
      
      <div className="deploy-card-body">
        <p className="text-sm mb-6 text-gray-600">
          Deploy your smart contract to the {network.name} blockchain.
          You'll need {network.currency} in your wallet to pay for gas fees.
        </p>
        
        <button
          onClick={handleDeploy}
          disabled={loading || !contract || !account}
          className={`deploy-button ${
            loading
              ? 'deploy-loading'
              : !contract || !account
                ? 'deploy-disabled'
                : 'deploy-ready'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <div className="loading-spinner mr-2"></div>
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
          <div className="deploy-error-message">
            <i className="fa-solid fa-triangle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        {txHash && !success && (
          <div className="deploy-status-card deploy-pending">
            <div className="flex items-center mb-3">
              <div className="status-icon pending">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              </div>
              <span className="font-medium">Transaction in progress</span>
            </div>
            <p className="text-sm font-medium mb-2">Transaction Hash:</p>
            <div className="hash-container">
              <a
                href={getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="hash-link"
              >
                {txHash}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(txHash)}
                className="copy-button"
                title="Copy to clipboard"
              >
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>
        )}

        {success && deployedAddress && (
          <div className="deploy-status-card deploy-success">
            <div className="flex items-center mb-3">
              <div className="status-icon success">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <span className="font-medium">Contract deployed successfully!</span>
            </div>
            
            <p className="text-sm font-medium mb-2">Contract Address:</p>
            <div className="hash-container">
              <a
                href={getAddressExplorerUrl(deployedAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hash-link"
              >
                {deployedAddress}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(deployedAddress)}
                className="copy-button"
                title="Copy to clipboard"
              >
                <i className="fa-regular fa-copy"></i>
              </button>
            </div>
            
            <div className="tip-container">
              <i className="fa-solid fa-lightbulb mr-2"></i>
              <p className="text-sm">
                Click on the <strong>Interaction</strong> tab in the editor to interact with your deployed contract.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeployButton;