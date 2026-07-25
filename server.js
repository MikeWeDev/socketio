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

  io.emit("online-users", connectedUsers);

  socket.on("join", (username: string) => {
    socket.data.username = username;

    io.emit("message", {
      username: "System",
      text: `${username} joined the chat`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      system: true,
    });
  });

  socket.on("message", (message) => {
    socket.broadcast.emit("message", message);
  });

  socket.on("disconnect", () => {
    connectedUsers--;

    io.emit("online-users", connectedUsers);

    if (socket.data.username) {
      io.emit("message", {
        username: "System",
        text: `${socket.data.username} left the chat`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        system: true,
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3001");
});