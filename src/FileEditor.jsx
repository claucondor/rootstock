import React, { useState } from 'react';
import { useFileSystem } from './fileSystemState';
import MonacoEditor from '@monaco-editor/react';
import { Box, Stack, Typography, IconButton, Tooltip, Button, useTheme } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import LinkIcon from '@mui/icons-material/Link';
import { useSnackbar } from 'notistack';

function getNodeByPath(node, path) {
  if (!path || path.length === 0) return node;
  const [head, ...rest] = path;
  if (node.type === 'folder' && node.children) {
    const child = node.children.find((c) => c.name === head);
    if (child) return getNodeByPath(child, rest);
  }
  return null;
}

// Utilidad para extraer imports de Solidity
function extractImports(content) {
  const regex = /import\s+['\"]([^'\"]+)['\"]/g;
  const imports = [];
  let match;
  while ((match = regex.exec(content))) {
    imports.push(match[1]);
  }
  return imports;
}

// Utilidad para obtener nombre de archivo desde URL
function getFileNameFromUrl(url) {
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0];
}

export default function FileEditor({ selectedPath }) {
  const { fileTree, updateFileContent, createFile } = useFileSystem();
  const node = selectedPath ? getNodeByPath(fileTree, selectedPath) : null;
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [saving, setSaving] = useState(false);

  if (!node || node.type !== 'file') {
    return <Box p={3}><Typography color="text.secondary">Selecciona un archivo para editar.</Typography></Box>;
  }

  // Guardar (simulado, ya que el cambio es instantáneo)
  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      enqueueSnackbar('Archivo guardado', { variant: 'success' });
    }, 500);
  };

  // Resolver imports remotos
  const handleResolveImports = async () => {
    const imports = extractImports(node.content);
    let success = 0, fail = 0;
    for (const imp of imports) {
      if (imp.startsWith('http://') || imp.startsWith('https://')) {
        try {
          const res = await fetch(imp);
          if (!res.ok) throw new Error('No se pudo descargar: ' + imp);
          const content = await res.text();
          const fileName = getFileNameFromUrl(imp);
          createFile(['root'], fileName, 'file');
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('updateFileContent', { detail: { path: ['root', fileName], content } });
              window.dispatchEvent(event);
            }
          }, 100);
          success++;
        } catch (err) {
          fail++;
        }
      } else if (imp.startsWith('@openzeppelin/')) {
        const githubUrl = 'https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/' + imp.replace('@openzeppelin/', '');
        try {
          const res = await fetch(githubUrl);
          if (!res.ok) throw new Error('No se pudo descargar: ' + githubUrl);
          const content = await res.text();
          const fileName = getFileNameFromUrl(imp);
          createFile(['root'], fileName, 'file');
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('updateFileContent', { detail: { path: ['root', fileName], content } });
              window.dispatchEvent(event);
            }
          }, 100);
          success++;
        } catch (err) {
          fail++;
        }
      }
    }
    if (success > 0) enqueueSnackbar(`Se descargaron ${success} imports remotos`, { variant: 'success' });
    if (fail > 0) enqueueSnackbar(`No se pudieron descargar ${fail} imports`, { variant: 'error' });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', background: theme.palette.mode === 'dark' ? '#23272f' : '#f5f7fa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{node.name}</Typography>
        <Tooltip title="Resolver imports remotos">
          <IconButton color="primary" onClick={handleResolveImports}><LinkIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Guardar archivo">
          <span>
            <IconButton color="primary" onClick={handleSave} disabled={saving}><SaveIcon /></IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <MonacoEditor
          height="100%"
          language={node.name.endsWith('.sol') ? 'solidity' : 'javascript'}
          theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
          value={node.content}
          onChange={value => updateFileContent(selectedPath, value)}
          options={{ fontSize: 16, minimap: { enabled: false }, theme: theme.palette.mode === 'dark' ? 'vs-dark' : 'light', fontFamily: 'Fira Mono, monospace' }}
        />
      </Box>
    </Box>
  );
} 