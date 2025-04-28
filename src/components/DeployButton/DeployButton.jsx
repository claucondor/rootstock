import React, { useState } from 'react';
import { ethers } from 'ethers';

function DeployButton({ contract, account, network }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

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
      await deployedContract.waitForDeployment();

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={handleDeploy}
        disabled={loading || !contract || !account}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
          loading
            ? 'bg-gray-500 text-white cursor-not-allowed'
            : !contract || !account
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {loading ? (
          'Deploying...'
        ) : (
          'Deploy Contract'
        )}
      </button>

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 text-green-500 text-sm">
          Contract deployed successfully!
        </div>
      )}
    </div>
  );
}

export default DeployButton;