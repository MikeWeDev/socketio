import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

let connectedUsers = 0;

app.use(cors());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    users: connectedUsers,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});


io.on("connection", (socket) => {
  connectedUsers++;

  console.log("User connected:", socket.id);

  io.emit("online-users", connectedUsers);

 socket.on("join", (username: string) => {
  const trimmedUsername = username.trim();

  if (!trimmedUsername || socket.data.username === trimmedUsername) {
    return;
  }

  socket.data.username = trimmedUsername;

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
    io.emit("message", message);
  });

  socket.on("typing", (isTyping: boolean) => {
    if (socket.data.username) {
      socket.broadcast.emit("user-typing", {
        username: socket.data.username,
        isTyping,
      });
    }
  });

  socket.on("disconnect", () => {
    connectedUsers = Math.max(0, connectedUsers - 1);

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

      socket.broadcast.emit("user-typing", {
        username: socket.data.username,
        isTyping: false,
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});