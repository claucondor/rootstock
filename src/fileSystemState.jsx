import React, { createContext, useContext, useState } from 'react';

// Estructura inicial de ejemplo
const initialFileTree = {
  name: 'root',
  type: 'folder',
  children: [
    { name: 'App.sol', type: 'file', content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract App {\n    string public message = "Hello Rootstock!";\n}' },
  ],
};

const FileSystemContext = createContext();

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getNodeByPath(node, path) {
  if (!path || path.length === 0) return node;
  const [head, ...rest] = path;
  if (node.type === 'folder' && node.children) {
    const child = node.children.find((c) => c.name === head);
    if (child) return getNodeByPath(child, rest);
  }
  return null;
}

export function FileSystemProvider({ children }) {
  const [fileTree, setFileTree] = useState(initialFileTree);
  const [selectedFile, setSelectedFile] = useState(['root', 'App.sol']);

  // Crear archivo o carpeta
  const createFile = (path, name, type) => {
    setFileTree(prev => {
      const tree = deepClone(prev);
      const parent = getNodeByPath(tree, path);
      if (parent && parent.type === 'folder') {
        if (parent.children.find(c => c.name === name)) return prev; // No sobrescribir
        parent.children.push(type === 'file' ? { name, type, content: '' } : { name, type, children: [] });
      }
      return tree;
    });
  };

  // Renombrar archivo o carpeta
  const renameFile = (path, newName) => {
    setFileTree(prev => {
      const tree = deepClone(prev);
      const node = getNodeByPath(tree, path);
      if (node) node.name = newName;
      return tree;
    });
  };

  // Eliminar archivo o carpeta
  const deleteFile = (path) => {
    setFileTree(prev => {
      const tree = deepClone(prev);
      if (path.length === 0) return prev; // No borrar root
      const parent = getNodeByPath(tree, path.slice(0, -1));
      if (parent && parent.type === 'folder') {
        parent.children = parent.children.filter(c => c.name !== path[path.length - 1]);
      }
      return tree;
    });
    setSelectedFile(null);
  };

  // Editar contenido de archivo
  const updateFileContent = (path, content) => {
    setFileTree(prev => {
      const tree = deepClone(prev);
      const node = getNodeByPath(tree, path);
      if (node && node.type === 'file') {
        node.content = content;
      }
      return tree;
    });
  };

  return (
    <FileSystemContext.Provider value={{ fileTree, setFileTree, selectedFile, setSelectedFile, createFile, renameFile, deleteFile, updateFileContent }}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystem() {
  return useContext(FileSystemContext);
} 