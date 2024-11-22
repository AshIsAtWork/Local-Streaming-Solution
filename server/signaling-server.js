const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 8080 });

const clients = [];
server.on('connection', (socket) => {
  console.log('New client connected.');
  clients.push(socket);

  socket.on('message', (message) => {
    console.log('Received:', message);
    clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  socket.on('close', () => {
    console.log('Client disconnected.');
    const index = clients.indexOf(socket);
    if (index > -1) clients.splice(index, 1);
  });
});

console.log('Signaling server running on ws://localhost:8080');