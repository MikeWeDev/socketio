import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

let connectedUsers = 0;

io.on("connection", (socket) => {
  connectedUsers++;

  console.log("User connected:", socket.id);
  console.log("Connected users:", connectedUsers);


  socket.on("message", (message) => {
    console.log(message);

    // send to everyone except sender
    socket.broadcast.emit("message", message);
  });


  socket.on("disconnect", () => {
    connectedUsers--;

    console.log("User disconnected:", socket.id);
    console.log("Connected users:", connectedUsers);
  });
});


server.listen(3001, () => {
  console.log("Server running on port 3001");
});