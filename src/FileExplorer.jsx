import React, { useState, useMemo } from 'react';
import { useFileSystem } from './fileSystemState';
import JSZip from 'jszip';
import {
  Box, Typography, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Menu, MenuItem, Divider
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  FileUpload as FileUploadIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { TreeView, TreeItem } from '@mui/lab';
import { useSnackbar } from 'notistack';

function getNodeId(path) {
  return path.join('/');
}

function FileTree({ node, path = [], onAction, onSelect, selectedId }) {
  const nodeId = getNodeId([...path, node.name]);
  const isFile = node.type === 'file';
  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            cursor: isFile ? 'pointer' : 'default',
            bgcolor: selectedId === nodeId ? 'primary.main' : 'inherit',
            color: selectedId === nodeId ? '#fff' : 'inherit',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            '&:hover': isFile ? { bgcolor: 'primary.light', color: '#fff' } : {},
          }}
          onClick={isFile ? () => onSelect(nodeId, [...path, node.name]) : undefined}
        >
          {node.type === 'folder' ? <FolderIcon color={selectedId === nodeId ? 'inherit' : 'primary'} fontSize="small" /> : <FileIcon color={selectedId === nodeId ? 'inherit' : 'action'} fontSize="small" />}
          <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 500, color: 'inherit' }}>{node.name}</Typography>
          <FileActions node={node} path={[...path, node.name]} onAction={onAction} />
        </Box>
      }
    >
      {node.type === 'folder' && node.children && node.children.length > 0 && node.children.map(child => (
        <FileTree key={child.name} node={child} path={[...path, node.name]} onAction={onAction} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </TreeItem>
  );
}

function FileActions({ node, path, onAction }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title="Más acciones">
        <IconButton size="small" onClick={handleMenu}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => { onAction('rename', path, node); handleClose(); }}>Renombrar</MenuItem>
        {node.type === 'folder' && <MenuItem onClick={() => { onAction('add', path, node); handleClose(); }}>Agregar archivo</MenuItem>}
        <MenuItem onClick={() => { onAction('upload', path, node); handleClose(); }}>Subir archivo</MenuItem>
        {path.length > 1 && <MenuItem onClick={() => { onAction('delete', path, node); handleClose(); }}>Eliminar</MenuItem>}
      </Menu>
    </>
  );
}

function EmptyState() {
  return (
    <Box textAlign="center" py={6} color="text.secondary">
      <Typography variant="body1" gutterBottom>
        No hay archivos ni carpetas.<br />
        Usa los botones de abajo para crear o importar archivos.
      </Typography>
    </Box>
  );
}

function addToZip(zip, node, basePath = '') {
  if (node.type === 'file') {
    zip.file(basePath + node.name, node.content || '');
  } else if (node.type === 'folder' && node.children) {
    const folder = zip.folder(basePath + (node.name !== 'root' ? node.name + '/' : ''));
    node.children.forEach(child => {
      addToZip(folder, child, '');
    });
  }
}

async function addZipToTree(zipObj, createFile, updateFileContent, parentPath = ['root']) {
  for (const relativePath in zipObj.files) {
    const file = zipObj.files[relativePath];
    if (file.dir) {
      const parts = relativePath.split('/').filter(Boolean);
      if (parts.length > 0) {
        createFile([...parentPath, ...parts.slice(0, -1)], parts[parts.length - 1], 'folder');
      }
    } else {
      const parts = relativePath.split('/').filter(Boolean);
      if (parts.length > 1) {
        createFile([...parentPath, ...parts.slice(0, -1)], parts[parts.length - 1], 'file');
      } else {
        createFile(parentPath, parts[0], 'file');
      }
      const content = await file.async('text');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('updateFileContent', { detail: { path: [...parentPath, ...parts], content } });
          window.dispatchEvent(event);
        }
      }, 100);
    }
  }
}

// Recursivo: obtiene todos los nodeId de carpetas
function getAllFolderNodeIds(node, path = []) {
  let ids = [];
  if (node.type === 'folder') {
    const nodeId = getNodeId([...path, node.name]);
    ids.push(nodeId);
    if (node.children) {
      for (const child of node.children) {
        ids = ids.concat(getAllFolderNodeIds(child, [...path, node.name]));
      }
    }
  }
  return ids;
}

export default function FileExplorer() {
  const { fileTree, updateFileContent, createFile, renameFile, deleteFile, setSelectedFile } = useFileSystem();
  const { enqueueSnackbar } = useSnackbar();
  const [dialog, setDialog] = useState({ open: false });
  const [selected, setSelected] = useState('root/App.sol');
  const [inputValue, setInputValue] = useState('');

  // Expande todos los folders por defecto
  const expanded = useMemo(() => getAllFolderNodeIds(fileTree), [fileTree]);

  React.useEffect(() => {
    window.updateFileContentGlobal = updateFileContent;
    return () => { window.updateFileContentGlobal = null; };
  }, [updateFileContent]);

  // Exportar como ZIP
  const handleExportZip = async () => {
    const zip = new JSZip();
    addToZip(zip, fileTree);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'proyecto.zip';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    enqueueSnackbar('Proyecto exportado como ZIP', { variant: 'success' });
  };

  // Importar ZIP
  const handleImportZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const zip = await JSZip.loadAsync(file);
    await addZipToTree(zip, createFile, updateFileContent);
    enqueueSnackbar('Proyecto importado correctamente', { variant: 'success' });
    e.target.value = '';
  };

  // Acciones del menú contextual
  const handleAction = (action, path, node) => {
    if (action === 'add') {
      setDialog({ open: true, type: 'add', path });
    } else if (action === 'rename') {
      setDialog({ open: true, type: 'rename', path, oldName: node.name });
    } else if (action === 'delete') {
      if (window.confirm('¿Seguro que quieres eliminar este elemento?')) {
        deleteFile(path);
        enqueueSnackbar('Elemento eliminado', { variant: 'info' });
      }
    } else if (action === 'upload') {
      setDialog({ open: true, type: 'upload', path });
    }
  };

  // Subida de archivos desde el diálogo
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const content = await file.text();
      createFile(dialog.path, file.name, 'file');
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('updateFileContent', { detail: { path: [...dialog.path, file.name], content } });
          window.dispatchEvent(event);
        }
      }, 100);
    }
    setDialog({ open: false });
    enqueueSnackbar('Archivo(s) subido(s)', { variant: 'success' });
  };

  React.useEffect(() => {
    if (dialog.type === 'rename') setInputValue(dialog.oldName || '');
    else setInputValue('');
  }, [dialog]);

  const handleDialogOk = () => {
    if (dialog.type === 'add') {
      if (inputValue.trim()) {
        createFile(dialog.path, inputValue.trim(), 'file');
        setDialog({ open: false });
        enqueueSnackbar('Archivo creado', { variant: 'success' });
      }
    } else if (dialog.type === 'rename') {
      if (inputValue.trim()) {
        renameFile(dialog.path, inputValue.trim());
        setDialog({ open: false });
        enqueueSnackbar('Elemento renombrado', { variant: 'success' });
      }
    }
  };

  // Determinar si hay archivos/carpeta además de root
  const hasFiles = fileTree.children && fileTree.children.length > 0;

  // Selección de archivo/tab
  const handleSelect = (nodeId, pathArr) => {
    setSelected(nodeId);
    setSelectedFile(pathArr);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f7fafd', borderRadius: 2, boxShadow: 1, p: 0 }}>
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18 }}>Explorador de Archivos</Typography>
        <Box>
          <Tooltip title="Exportar proyecto como ZIP">
            <IconButton color="primary" onClick={handleExportZip} size="small"><DownloadIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Importar proyecto ZIP">
            <IconButton color="success" component="label" size="small">
              <FileUploadIcon />
              <input type="file" accept=".zip" hidden onChange={handleImportZip} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        {hasFiles ? (
          <TreeView
            expanded={expanded}
            selected={selected}
            onNodeToggle={() => {}} // No-op, expansión automática
            onNodeSelect={(_, nodeId) => setSelected(nodeId)}
            sx={{ flexGrow: 1, minHeight: 300, background: 'transparent', p: 1 }}
            defaultExpandIcon={<FolderIcon fontSize="small" />}
            defaultCollapseIcon={<FolderIcon fontSize="small" />}
          >
            {fileTree.children.map(child => (
              <FileTree key={child.name} node={child} path={['root']} onAction={handleAction} onSelect={handleSelect} selectedId={selected} />
            ))}
          </TreeView>
        ) : (
          <EmptyState />
        )}
      </Box>
      <Divider />
      <Box sx={{ p: 1, display: 'flex', gap: 1, justifyContent: 'center', background: '#f5f7fa' }}>
        <Tooltip title="Crear archivo en raíz"><IconButton color="primary" onClick={() => setDialog({ open: true, type: 'add', path: ['root'] })}><AddIcon /></IconButton></Tooltip>
        <Tooltip title="Subir archivo a raíz"><IconButton color="primary" component="label">
          <UploadIcon />
          <input type="file" multiple hidden onChange={e => { setDialog({ open: false }); handleFileUpload(e); }} />
        </IconButton></Tooltip>
      </Box>
      {/* Diálogo para agregar/renombrar/subir */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false })}>
        {dialog.type === 'add' && (
          <>
            <DialogTitle>Agregar archivo</DialogTitle>
            <DialogContent>
              <TextField label="Nombre" value={inputValue} onChange={e => setInputValue(e.target.value)} autoFocus fullWidth />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false })}>Cancelar</Button>
              <Button onClick={handleDialogOk} variant="contained">Agregar</Button>
            </DialogActions>
          </>
        )}
        {dialog.type === 'rename' && (
          <>
            <DialogTitle>Renombrar</DialogTitle>
            <DialogContent>
              <TextField label="Nuevo nombre" value={inputValue} onChange={e => setInputValue(e.target.value)} autoFocus fullWidth />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false })}>Cancelar</Button>
              <Button onClick={handleDialogOk} variant="contained">Renombrar</Button>
            </DialogActions>
          </>
        )}
        {dialog.type === 'upload' && (
          <>
            <DialogTitle>Subir archivo(s)</DialogTitle>
            <DialogContent>
              <Button variant="contained" component="label" startIcon={<UploadIcon />}>
                Seleccionar archivos
                <input type="file" multiple hidden onChange={handleFileUpload} />
              </Button>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialog({ open: false })}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 