const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http,{
  allowEIO3: true,
  cors: {
    origin: '*',
  }
});
const port = process.env.PORT || 8181;
const config = require('./config');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let instances = [];
let instanceToSocket = {};

let masterPeer = {};

app.get("/get_master_peer", (req, res) => {
  res.send(masterPeer);
});

app.get("/set_master_peer/:pid", (req, res) => {
  if(req.get("authorization") === config.authkey){
    masterPeer = {
      peerID: req.params.pid,
      setTime: Date.now()
    };
    console.log("master peer set success",req.params.pid);
  }else{
    console.log("master peer set fail",req.params.pid);
  }
  res.send(masterPeer);
});

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

  socket.on("setMasterPeerLocal", (authkey, peerID) => {
    if(authkey === config.authkey){
      masterPeer = {
        peerID: peerID,
        setTime: Date.now()
      };
      console.log("master peer set success through socket",peerID);
    }
  });


  socket.on("input", (inst, key, state) => {
    if(!instances.includes(inst)) return;
    if(typeof state != "boolean") return;
    if(Number.isNaN(key)) return;
    instanceToSocket[inst].emit("key", state?key:-key);
  });
  
  const forwards = ["toggleBorderless","toggleNativeInputBlock","toggleNativeGamepadBlock","resetInput"];
  forwards.forEach(ev => {
    socket.on(ev, (inst) => {
      if(!instances.includes(inst)) return;
      instanceToSocket[inst].emit(ev, Date.now().toString());
    });
  });
});

http.listen(port,"0.0.0.0", () => {
  console.log(`Socket.IO server running at http://0.0.0.0:${port}/`);
});
