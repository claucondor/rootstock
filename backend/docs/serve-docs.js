const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DOCS_DIR = __dirname;

// Mapeo de extensiones de archivo a tipos MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.md': 'text/markdown',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Crear el servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Normalizar la URL
  let url = req.url;
  if (url === '/') {
    url = '/index.html';
  }
  
  // Construir la ruta del archivo
  const filePath = path.join(DOCS_DIR, url);
  
  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`Archivo no encontrado: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    // Leer el archivo
    fs.readFile(filePath, (err, data) => {
      if (err) {
        console.error(`Error al leer el archivo: ${err}`);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      
      // Determinar el tipo MIME
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      
      // Enviar la respuesta
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Iniciar el servidor
server.listen(PORT, () => {
  console.log(`Servidor de documentación iniciado en http://localhost:${PORT}`);
  console.log(`Presiona Ctrl+C para detener el servidor`);
});