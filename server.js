const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public")); 

io.on("connection", (socket) => {
  let userName = ""; 
  let currentRoom = ""; 

  // Handle user joining a room
  socket.on("join_room", (username, room) => {
    userName = username;
    if (currentRoom) {
      socket.leave(currentRoom); 
      socket.to(currentRoom).emit("message", { type: "system", text: `${userName} has left the room.` });
    }
    socket.join(room);
    currentRoom = room;
    
    socket.emit("message", { type: "system", text: `Welcome to ${room}!` });
    socket.to(room).emit("message", { type: "system", text: `${username} has joined the room.` }); 
    io.emit("update_rooms", getRoomList());
  });

  // Handle user sending a message to the room
  socket.on("message", (msg, room) => {
    if (room) {
      // Send only to others in the room
      socket.to(room).emit("message", { type: "chat", sender: userName, text: msg });
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    if (currentRoom && userName) {
      socket.to(currentRoom).emit("message", { type: "system", text: `${userName} has left the room.` });
    }
    io.emit("update_rooms", getRoomList());
  });

  // Helper function to get the list of rooms
  const getRoomList = () => {
    const rooms = {};
    const socketIds = new Set([...io.sockets.sockets.keys()]);

    for (const [room, socketSet] of io.sockets.adapter.rooms) {
      if (!socketIds.has(room)) { 
        rooms[room] = socketSet.size;
      }
    }

    return rooms;
  };
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
