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

// Cambia esto por la URL de tu backend
const API_URL = import.meta.env.VITE_API_URL || 'https://<TU-URL-DE-CLOUD-RUN>';

async function compileWithBackend(source) {
  const res = await fetch(`${API_URL}/compile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });
  if (!res.ok) throw new Error('Error al comunicarse con el compilador backend');
  const data = await res.json();
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors.join('\n'));
  }
  return {
    abi: data.abi,
    bytecode: data.bytecode,
    contractName: 'Contract',
    warnings: data.warnings,
  };
}

const LOGO = 'https://cryptologos.cc/logos/rootstock-rsk-logo.png?v=026';

function Spinner() {
  return <span style={{ marginLeft: 8, display: 'inline-block', width: 18, height: 18, border: '3px solid #ccc', borderTop: '3px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />;
}

function Step({ num, label, active, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: done ? '#28a745' : active ? '#007bff' : '#e0e0e0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16
      }}>{done ? '✓' : num}</div>
      <span style={{ color: active ? '#007bff' : done ? '#28a745' : '#888', fontWeight: active || done ? 600 : 400 }}>{label}</span>
    </div>
  );
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      title={`Copiar ${label}`}
      style={{ marginLeft: 8, border: 'none', background: 'none', cursor: 'pointer', color: copied ? '#28a745' : '#007bff', fontSize: 18 }}
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

function Alert({ type, children, onClose }) {
  return (
    <div style={{
      background: type === 'error' ? '#fff0f0' : type === 'success' ? '#f0fff0' : '#fffbe0',
      color: type === 'error' ? '#b00020' : type === 'success' ? '#218838' : '#856404',
      border: `1px solid ${type === 'error' ? '#fbb' : type === 'success' ? '#bdf5bd' : '#ffe58f'}`,
      borderRadius: 8, padding: 12, margin: '12px 0', position: 'relative',
      boxShadow: '0 1px 4px #0001',
    }}>
      {children}
      {onClose && <button onClick={onClose} style={{ position: 'absolute', right: 8, top: 8, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>×</button>}
    </div>
  );
}

function ConstructorModal({ open, onSubmit, onClose }) {
  const [arg, setArg] = useState('¡Hola Rootstock!');
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002', position: 'relative' }}>
        <h3>Argumento para el constructor</h3>
        <input
          type="text"
          value={arg}
          onChange={e => setArg(e.target.value)}
          style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 6, border: '1px solid #ccc', marginBottom: 16 }}
          placeholder="Ingresa el argumento (string)"
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ background: '#eee', border: 'none', borderRadius: 6, padding: '6px 18px', fontSize: 16, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={() => onSubmit(arg)} style={{ background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontSize: 16, cursor: 'pointer' }}>Deployar</button>
        </div>
      </div>
    </div>
  );
}

function InteractSection({ abi, address, network, account }) {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [inputs, setInputs] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!address || !abi) return;
    const prov = new ethers.BrowserProvider(window.ethereum);
    setProvider(prov);
    setContract(new ethers.Contract(address, abi, prov));
  }, [address, abi]);

  if (!abi || !address) return null;

  // Agrupar funciones por tipo
  const functions = abi.filter(f => f.type === 'function');
  const readFns = functions.filter(f => f.stateMutability === 'view' || f.stateMutability === 'pure');
  const writeFns = functions.filter(f => f.stateMutability !== 'view' && f.stateMutability !== 'pure');

  const handleInput = (fn, idx, value) => {
    setInputs(prev => ({
      ...prev,
      [fn.name]: {
        ...prev[fn.name],
        [idx]: value
      }
    }));
  };

  const handleCall = async (fn) => {
    setError(null);
    setLoading(l => ({ ...l, [fn.name]: true }));
    try {
      const args = (inputs[fn.name] ? Object.values(inputs[fn.name]) : []);
      let result;
      if (fn.stateMutability === 'view' || fn.stateMutability === 'pure') {
        result = await contract[fn.name](...args);
        setResults(r => ({ ...r, [fn.name]: result }));
      } else {
        // Escritura: requiere signer
        const prov = new ethers.BrowserProvider(window.ethereum);
        const signer = await prov.getSigner();
        const contractWithSigner = new ethers.Contract(address, abi, signer);
        const tx = await contractWithSigner[fn.name](...args);
        setResults(r => ({ ...r, [fn.name]: { txHash: tx.hash } }));
      }
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(l => ({ ...l, [fn.name]: false }));
    }
  };

  // Renderiza el resultado de forma robusta
  function renderResult(val) {
    if (val && typeof val === 'object' && 'txHash' in val) {
      return <span>Tx Hash: {val.txHash} <CopyButton value={val.txHash} label="Tx Hash" /></span>;
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return <span>{String(val)} <CopyButton value={String(val)} label="Resultado" /></span>;
    }
    if (Array.isArray(val)) {
      return <span>[{val.map((v, i) => <span key={i}>{JSON.stringify(v)}{i < val.length - 1 ? ', ' : ''}</span>)}] <CopyButton value={JSON.stringify(val)} label="Resultado" /></span>;
    }
    if (typeof val === 'object' && val !== null) {
      return <span>{JSON.stringify(val)} <CopyButton value={JSON.stringify(val)} label="Resultado" /></span>;
    }
    return <span>Sin resultado</span>;
  }

  return (
    <div className="result-box" style={{ marginTop: 32, border: '1px solid #e0e0e0', background: '#f8fafd' }}>
      <h3 style={{ color: '#007bff', marginTop: 0 }}>Interactuar con el contrato</h3>
      <div style={{ fontSize: 15, color: '#444', marginBottom: 12 }}>Puedes llamar a cualquier función pública del contrato desplegado.</div>
      {error && <Alert type="error" onClose={() => setError(null)}>{error}</Alert>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, flexDirection: 'row', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h4 style={{ color: '#28a745', margin: '8px 0' }}>Funciones de Lectura</h4>
          {readFns.length === 0 && <div style={{ color: '#888' }}>No hay funciones de lectura.</div>}
          {readFns.map(fn => (
            <div key={fn.name} style={{ marginBottom: 18, padding: 12, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff' }}>
              <div style={{ fontWeight: 600, color: '#007bff', marginBottom: 4 }}>{fn.name}({fn.inputs.map(i => i.type).join(', ')})</div>
              <form onSubmit={e => { e.preventDefault(); handleCall(fn); }} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {fn.inputs.map((input, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    placeholder={input.name ? `${input.name} (${input.type})` : input.type}
                    value={inputs[fn.name]?.[idx] || ''}
                    onChange={e => handleInput(fn, idx, e.target.value)}
                    style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, minWidth: 120 }}
                  />
                ))}
                <button type="submit" className="btn-main" disabled={loading[fn.name]} style={{ minWidth: 120 }}>
                  {loading[fn.name] ? 'Leyendo...' : 'Leer'}
                </button>
              </form>
              {results[fn.name] !== undefined && (
                <div style={{ marginTop: 8, background: '#f5f5f5', borderRadius: 6, padding: 8, fontSize: 15 }}>
                  <b>Resultado:</b> {renderResult(results[fn.name])}
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h4 style={{ color: '#b77d00', margin: '8px 0' }}>Funciones de Escritura</h4>
          {writeFns.length === 0 && <div style={{ color: '#888' }}>No hay funciones de escritura.</div>}
          {writeFns.map(fn => (
            <div key={fn.name} style={{ marginBottom: 18, padding: 12, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff' }}>
              <div style={{ fontWeight: 600, color: '#007bff', marginBottom: 4 }}>{fn.name}({fn.inputs.map(i => i.type).join(', ')})</div>
              <form onSubmit={e => { e.preventDefault(); handleCall(fn); }} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                {fn.inputs.map((input, idx) => (
                  <input
                    key={idx}
                    type="text"
                    required
                    placeholder={input.name ? `${input.name} (${input.type})` : input.type}
                    value={inputs[fn.name]?.[idx] || ''}
                    onChange={e => handleInput(fn, idx, e.target.value)}
                    style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, minWidth: 120 }}
                  />
                ))}
                <button type="submit" className="btn-main" disabled={loading[fn.name]} style={{ minWidth: 120 }}>
                  {loading[fn.name] ? 'Enviando...' : 'Enviar Tx'}
                </button>
              </form>
              {results[fn.name] !== undefined && (
                <div style={{ marginTop: 8, background: '#f5f5f5', borderRadius: 6, padding: 8, fontSize: 15 }}>
                  <b>Resultado:</b> {renderResult(results[fn.name])}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const [compileResult, setCompileResult] = useState(null);
  const [showABI, setShowABI] = useState(false);
  const [showBytecode, setShowBytecode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [constructorDeploy, setConstructorDeploy] = useState(null);

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

  async function handleCompile() {
    setCompiling(true);
    setError(null);
    setCompileResult(null);
    try {
      const result = await compileWithBackend(code);
      setCompileResult(result);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setCompiling(false);
    }
  }

  async function handleDeploy() {
    setDeploying(true);
    setDeployResult(null);
    setError(null);
    setCompiling(true);
    try {
      // 1. Compilar usando el backend propio
      const { abi, bytecode, contractName } = await compileWithBackend(code);
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
        setShowModal(true);
        setConstructorDeploy(() => async (arg) => {
          setShowModal(false);
          contract = await factory.deploy(arg);
          await contract.deploymentTransaction().wait();
          setDeployResult({
            address: contract.target,
            txHash: contract.deploymentTransaction().hash,
            contractName,
          });
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3500);
        });
        setDeploying(false);
        setCompiling(false);
        return;
      } else {
        contract = await factory.deploy();
      }
      await contract.deploymentTransaction().wait();
      setDeployResult({
        address: contract.target,
        txHash: contract.deploymentTransaction().hash,
        contractName,
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setDeploying(false);
      setCompiling(false);
    }
  }

  // Scroll al resultado tras deploy/compilación
  useEffect(() => {
    if (deployResult || compileResult) {
      setTimeout(() => {
        const el = document.getElementById('result-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }, [deployResult, compileResult]);

  return (
    <div style={{ maxWidth: 900, margin: '2rem auto', fontFamily: 'Inter, sans-serif', background: '#f8fafc', borderRadius: 18, boxShadow: '0 2px 16px #0001', padding: 0 }}>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .main-container { padding: 8px !important; }
          .steps { flex-direction: column !important; gap: 8px !important; }
        }
        .btn-main { background: #007bff; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.5rem; font-size: 18px; margin-right: 12px; cursor: pointer; transition: background 0.2s; }
        .btn-main:disabled { background: #b0c4de; cursor: not-allowed; }
        .btn-main:hover:not(:disabled) { background: #0056b3; }
        .section { margin-bottom: 2rem; }
        .label { font-weight: 600; margin-right: 8px; }
        .result-box { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px #0001; padding: 16px; margin-top: 12px; }
        .collapsible { cursor: pointer; color: #007bff; text-decoration: underline; margin-bottom: 4px; display: inline-block; }
      `}</style>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: 24, borderBottom: '1px solid #e0e0e0', background: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
        <img src={LOGO} alt="Rootstock" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div>
          <h1 style={{ margin: 0, color: '#007bff', fontSize: 28 }}>RSK Solidity Deployer</h1>
          <div style={{ color: '#444', fontSize: 16 }}>Compila y despliega contratos Solidity en la red Rootstock fácilmente.</div>
        </div>
      </div>
      {/* Pasos visuales */}
      <div className="steps" style={{ display: 'flex', gap: 24, justifyContent: 'center', margin: '32px 0 24px 0' }}>
        <Step num={1} label="Conectar Wallet" active={!account} done={!!account} />
        <Step num={2} label="Editar Contrato" active={!!account && !compileResult} done={!!compileResult} />
        <Step num={3} label="Compilar" active={!!account && !deployResult && !!compileResult} done={!!compileResult && !deploying} />
        <Step num={4} label="Deploy" active={!!account && !!compileResult && !deployResult} done={!!deployResult} />
      </div>
      <div className="main-container" style={{ padding: 32 }}>
        {/* Wallet y red */}
        <div className="section" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <button onClick={connectWallet} disabled={!!account || connecting} className="btn-main" title="Conecta tu wallet para interactuar con la red">
              {account ? `Conectado: ${account.slice(0, 8)}...` : connecting ? <>Conectando...<Spinner /></> : 'Conectar MetaMask'}
            </button>
            <button onClick={addRSKTestnet} className="btn-main" title="Agrega la red RSK Testnet a MetaMask">Agregar RSK Testnet</button>
          </div>
          <div>
            <span className="label">Red:</span>
            <select
              value={network.chainId}
              onChange={e => setNetwork(NETWORKS.find(n => n.chainId === Number(e.target.value)))}
              style={{ borderRadius: 8, padding: '6px 12px', fontSize: 16 }}
              title="Selecciona la red donde desplegar"
            >
              {NETWORKS.map(n => (
                <option key={n.chainId} value={n.chainId}>{n.name}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Editor */}
        <div className="section" style={{ margin: '1rem 0', height: 350 }}>
          <div style={{ marginBottom: 8, color: '#888', fontSize: 15 }}>
            Escribe o pega tu contrato Solidity aquí. Ejemplo incluido por defecto.
          </div>
          <MonacoEditor
            height="100%"
            defaultLanguage="solidity"
            value={code}
            onChange={value => setCode(value)}
            options={{ fontSize: 16, minimap: { enabled: false }, theme: 'vs-light', placeholder: 'Escribe tu contrato Solidity aquí...' }}
          />
        </div>
        {/* Acciones */}
        <div className="section" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <button
            onClick={handleCompile}
            disabled={compiling}
            className="btn-main"
            title="Compila el contrato usando el backend"
          >
            {compiling ? <>Compilando...<Spinner /></> : 'Solo compilar'}
          </button>
          <button
            onClick={handleDeploy}
            disabled={deploying || !account || compiling}
            className="btn-main"
            title={!account ? 'Conecta tu wallet primero' : compiling ? 'Espera a que termine la compilación' : 'Despliega el contrato en la red seleccionada'}
          >
            {deploying ? <>Deployando...<Spinner /></> : compiling ? <>Compilando...<Spinner /></> : 'Deploy'}
          </button>
        </div>
        {/* Alertas y feedback */}
        {error && (
          <Alert type="error" onClose={() => setError(null)}><b>Error:</b> {error}</Alert>
        )}
        {showSuccess && (
          <Alert type="success" onClose={() => setShowSuccess(false)}><b>¡Contrato deployado exitosamente!</b></Alert>
        )}
        {/* Resultado de compilación y deploy */}
        <div id="result-section">
          {compileResult && (
            <div className="result-box">
              <b>Resultado de compilación:</b><br />
              <span className="collapsible" onClick={() => setShowABI(v => !v)}>{showABI ? 'Ocultar ABI' : 'Mostrar ABI'}</span>
              {showABI && (
                <div style={{ position: 'relative' }}>
                  <CopyButton value={JSON.stringify(compileResult.abi, null, 2)} label="ABI" />
                  <pre style={{ maxWidth: 600, overflowX: 'auto', background: '#f5f5f5', padding: 8, borderRadius: 6 }}>{JSON.stringify(compileResult.abi, null, 2)}</pre>
                </div>
              )}
              <span className="collapsible" onClick={() => setShowBytecode(v => !v)}>{showBytecode ? 'Ocultar Bytecode' : 'Mostrar Bytecode'}</span>
              {showBytecode && (
                <div style={{ position: 'relative' }}>
                  <CopyButton value={compileResult.bytecode} label="Bytecode" />
                  <pre style={{ maxWidth: 600, overflowX: 'auto', background: '#f5f5f5', padding: 8, borderRadius: 6 }}>{compileResult.bytecode}</pre>
                </div>
              )}
              {compileResult.warnings && compileResult.warnings.length > 0 && (
                <div style={{ color: 'orange', marginTop: 8 }}>
                  <b>Warnings:</b>
                  <ul>
                    {compileResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          {deployResult && (
            <div className="result-box" style={{ border: '1px solid #bdf5bd', background: '#f0fff0' }}>
              <b>Contrato desplegado:</b><br />
              Nombre: {deployResult.contractName}<br />
              Dirección: <a href={`${network.explorer}/address/${deployResult.address}`} target="_blank" rel="noopener noreferrer">{deployResult.address}</a>
              <CopyButton value={deployResult.address} label="Dirección" /><br />
              Tx Hash: <a href={`${network.explorer}/tx/${deployResult.txHash}`} target="_blank" rel="noopener noreferrer">{deployResult.txHash}</a>
              <CopyButton value={deployResult.txHash} label="Tx Hash" />
            </div>
          )}
          {deployResult && compileResult && (
            <InteractSection
              abi={compileResult.abi}
              address={deployResult.address}
              network={network}
              account={account}
            />
          )}
        </div>
      </div>
      <ConstructorModal open={showModal} onSubmit={arg => constructorDeploy && constructorDeploy(arg)} onClose={() => setShowModal(false)} />
    </div>
  );
}