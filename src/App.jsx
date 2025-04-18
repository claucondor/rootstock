import React, { useState, useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { ethers } from 'ethers';

const EXAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloRSK {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function setMessage(string memory _message) public {
        message = _message;
    }
}`;

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

async function compileWithRemix(source) {
  // Prepara el input para el compilador de Remix
  const input = {
    language: 'Solidity',
    sources: {
      'Contract.sol': {
        content: source,
      },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };
  const res = await fetch('https://remix.ethereum.org/compiler/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) throw new Error('Error al comunicarse con el compilador de Remix');
  const data = await res.json();
  const output = typeof data === 'string' ? JSON.parse(data) : data;
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      throw new Error(errors.map(e => e.formattedMessage).join('\n'));
    }
  }
  const contractName = Object.keys(output.contracts['Contract.sol'])[0];
  const contract = output.contracts['Contract.sol'][contractName];
  return {
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
    contractName,
  };
}

export default function App() {
  const [code, setCode] = useState(EXAMPLE_CONTRACT);
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState(null);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [compiling, setCompiling] = useState(false);

  async function connectWallet() {
    setConnecting(true);
    setError(null);
    try {
      if (!window.ethereum) throw new Error('MetaMask no está instalado.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setConnecting(false);
    }
  }

  async function addRSKTestnet() {
    setError(null);
    try {
      if (!window.ethereum) throw new Error('MetaMask no está instalado.');
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x1f', // 31 decimal
          chainName: 'RSK Testnet',
          rpcUrls: ['https://public-node.testnet.rsk.co'],
          nativeCurrency: { name: 'tRBTC', symbol: 'tRBTC', decimals: 18 },
          blockExplorerUrls: ['https://explorer.testnet.rsk.co'],
        }],
      });
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    setDeployResult(null);
    setError(null);
    setCompiling(true);
    try {
      // 1. Compilar usando Remix API
      const { abi, bytecode, contractName } = await compileWithRemix(code);
      setCompiling(false);
      if (!bytecode) throw new Error('No se pudo obtener el bytecode.');
      if (!window.ethereum) throw new Error('MetaMask no está instalado.');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentChainId = (await provider.getNetwork()).chainId;
      if (currentChainId !== network.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + network.chainId.toString(16) }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x' + network.chainId.toString(16),
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                nativeCurrency: { name: network.currency, symbol: network.currency, decimals: 18 },
                blockExplorerUrls: [network.explorer],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      let contract;
      if (abi.some(f => f.type === 'constructor' && f.inputs.length > 0)) {
        const arg = prompt('Argumento para el constructor (string):', '¡Hola Rootstock!');
        contract = await factory.deploy(arg);
      } else {
        contract = await factory.deploy();
      }
      await contract.deploymentTransaction().wait();
      setDeployResult({
        address: contract.target,
        txHash: contract.deploymentTransaction().hash,
        contractName,
      });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setDeploying(false);
      setCompiling(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1>RSK Solidity Deployer</h1>
      <div style={{ marginBottom: 16 }}>
        <button onClick={connectWallet} disabled={!!account || connecting} style={{ marginRight: 12 }}>
          {account ? `Conectado: ${account.slice(0, 8)}...` : connecting ? 'Conectando...' : 'Conectar MetaMask'}
        </button>
        <button onClick={addRSKTestnet} style={{ marginRight: 12 }}>
          Agregar RSK Testnet a MetaMask
        </button>
        <label>
          <b>Red:</b>
          <select
            value={network.chainId}
            onChange={e => setNetwork(NETWORKS.find(n => n.chainId === Number(e.target.value)))}
            style={{ marginLeft: 8 }}
          >
            {NETWORKS.map(n => (
              <option key={n.chainId} value={n.chainId}>{n.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ margin: '1rem 0', height: 350 }}>
        <MonacoEditor
          height="100%"
          defaultLanguage="solidity"
          value={code}
          onChange={value => setCode(value)}
          options={{ fontSize: 16 }}
        />
      </div>
      <button
        onClick={handleDeploy}
        disabled={deploying || !account || compiling}
        style={{ padding: '0.5rem 1.5rem', fontSize: 18 }}
      >
        {deploying ? 'Deployando...' : compiling ? 'Compilando...' : 'Deploy'}
      </button>
      {error && (
        <div style={{ color: 'red', marginTop: 16 }}><b>Error:</b> {error}</div>
      )}
      {deployResult && (
        <div style={{ marginTop: 20 }}>
          <b>Contrato desplegado:</b><br />
          Nombre: {deployResult.contractName}<br />
          Dirección: <a href={`${network.explorer}/address/${deployResult.address}`} target="_blank" rel="noopener noreferrer">{deployResult.address}</a><br />
          Tx Hash: <a href={`${network.explorer}/tx/${deployResult.txHash}`} target="_blank" rel="noopener noreferrer">{deployResult.txHash}</a>
        </div>
      )}
    </div>
  );
}