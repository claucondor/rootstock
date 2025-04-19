import React, { useState, useEffect, useMemo } from 'react';
import { FileSystemProvider, useFileSystem } from './fileSystemState';
import FileExplorer from './FileExplorer';
import FileEditor from './FileEditor';
import MonacoEditor from '@monaco-editor/react';
import {
  Box, AppBar, Toolbar, Typography, Tabs, Tab, IconButton, Button, Drawer, Stack, Snackbar, CssBaseline, Tooltip, useTheme, ThemeProvider, createTheme, Menu, MenuItem, Switch
} from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

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

function EditorTabs({ openFiles, activeFile, setActiveFile, closeFile }) {
  return (
    <Tabs
      value={activeFile ? openFiles.findIndex(f => f.join('/') === activeFile.join('/')) : false}
      onChange={(_, idx) => setActiveFile(openFiles[idx])}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
    >
      {openFiles.map((file, idx) => (
        <Tab
          key={file.join('/')}
          label={file[file.length - 1]}
          icon={<IconButton size="small" onClick={e => { e.stopPropagation(); closeFile(file); }}><CloseIcon fontSize="small" /></IconButton>}
          iconPosition="end"
          sx={{ minHeight: 40, textTransform: 'none', fontWeight: 500 }}
        />
      ))}
    </Tabs>
  );
}

function MainIDE() {
  const { selectedFile, setSelectedFile } = useFileSystem();
  const [openFiles, setOpenFiles] = useState([]); // Array de paths
  const [activeFile, setActiveFile] = useState(null);

  // Abrir archivo en tab
  useEffect(() => {
    if (selectedFile && selectedFile.length > 1) {
      const exists = openFiles.some(f => f.join('/') === selectedFile.join('/'));
      if (!exists) setOpenFiles(files => [...files, selectedFile]);
      setActiveFile(selectedFile);
    }
  }, [selectedFile]);

  // Cerrar tab
  const closeFile = (file) => {
    setOpenFiles(files => files.filter(f => f.join('/') !== file.join('/')));
    if (activeFile && file.join('/') === activeFile.join('/')) {
      // Si cierras el activo, activa el anterior o el primero
      const idx = openFiles.findIndex(f => f.join('/') === file.join('/'));
      const next = openFiles[idx - 1] || openFiles[idx + 1] || null;
      setActiveFile(next);
      setSelectedFile(next);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sidebar/Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: 260,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 260, boxSizing: 'border-box', background: 'linear-gradient(180deg, #23272f 0%, #2d323c 100%)', color: '#fff' },
        }}
        open
      >
        <Toolbar />
        <Box sx={{ p: 2, height: 'calc(100vh - 64px - 32px)', overflowY: 'auto' }}>
          <FileExplorer />
        </Box>
      </Drawer>
      {/* Panel derecho */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: theme => theme.palette.mode === 'dark' ? '#181a20' : '#fff' }}>
        <EditorTabs openFiles={openFiles} activeFile={activeFile} setActiveFile={setActiveFile} closeFile={closeFile} />
        <Box sx={{ flex: 1, minHeight: 0, p: 0 }}>
          {activeFile ? <FileEditor key={activeFile.join('/')} selectedPath={activeFile} /> : <Box p={4}><Typography color="text.secondary">Abre un archivo para editarlo.</Typography></Box>}
        </Box>
      </Box>
    </Box>
  );
}

function WalletMenu({ account, onConnect }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  return (
    <>
      <Button
        color="primary"
        variant="contained"
        startIcon={<AccountBalanceWalletIcon />}
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        {account ? `${account.slice(0, 8)}...` : 'Conectar Wallet'}
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {!account && <MenuItem onClick={() => { onConnect(); setAnchorEl(null); }}>Conectar MetaMask</MenuItem>}
        {account && <MenuItem disabled>Desconectar (próximamente)</MenuItem>}
      </Menu>
    </>
  );
}

export default function App() {
  // Tema oscuro/claro
  const [mode, setMode] = useState('dark');
  const theme = useMemo(() => createTheme({
    palette: { mode, primary: { main: '#007bff' }, background: { default: mode === 'dark' ? '#181a20' : '#f5f7fa' } },
    shape: { borderRadius: 10 },
    typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' }
  }), [mode]);

  // Estado de wallet (simulado aquí, integra tu lógica real)
  const [account, setAccount] = useState(null);
  const handleConnectWallet = () => setAccount('0x1234...abcd'); // Simulación

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <FileSystemProvider>
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="static" color="default" elevation={2} sx={{ zIndex: theme.zIndex.drawer + 1 }}>
              <Toolbar>
                <img src={LOGO} alt="Rootstock" style={{ width: 40, height: 40, borderRadius: 8, marginRight: 16 }} />
                <Typography variant="h6" color="primary" sx={{ flexGrow: 1, fontWeight: 700 }}>RSK Solidity Deployer</Typography>
                <Tooltip title={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'}>
                  <IconButton color="primary" onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}>
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Tooltip>
                <WalletMenu account={account} onConnect={handleConnectWallet} />
              </Toolbar>
            </AppBar>
            <MainIDE />
          </Box>
        </FileSystemProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}