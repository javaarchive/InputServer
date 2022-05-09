const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http,{
  allowEIO3: true
});
const port = process.env.PORT || 8181;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let instances = [];
let instanceToSocket = {};

io.on('connection', (socket) => {
  console.log("New connection",socket.id);
  socket.on('identifier', (id) => {
    instanceToSocket[id] = socket;
    if(instances.includes(id)) return;
    console.log("Added instance",id);
    instances.push(id);
  });
  socket.emit("identify",Date.now());
  socket.emit("hello","world",10);
  
  socket.on("loopback", (c) => socket.emit("loopback",c));

  socket.on("instances", () => {
    socket.emit("instanceList", instances);
  });

  socket.on("input", (inst, key, state) => {
    if(!instances.includes(inst)) return;
    if(typeof state != "boolean") return;
    if(Number.isNaN(key)) return;
    instanceToSocket[inst].emit("key", state?key:-key);
  });
  

});

http.listen(port,"0.0.0.0", () => {
  console.log(`Socket.IO server running at http://0.0.0.0:${port}/`);
});
