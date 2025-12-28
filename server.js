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
    socket.leave(currentRoom); 
    socket.join(room);
    currentRoom = room;
    io.to(room).emit("message", `${username} has joined the room: ${room}`); 
    io.emit("update_rooms", getRoomList());
  });

  // Handle user sending a message to the room
  socket.on("message", (msg, room) => {
    if (room) {
      io.to(room).emit("message", `${userName}: ${msg}`);
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    io.to(currentRoom).emit("message", `${userName} has left the room.`);
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

