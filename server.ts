import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SERVER_VERSION = "1.0.0";

let connectedUsers = 0;

app.use(
  cors({
    origin: CLIENT_URL,
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    version: SERVER_VERSION,
    uptime: process.uptime(),
    users: connectedUsers,
  });
});

app.get("/version", (_req, res) => {
  res.status(200).json({ version: SERVER_VERSION });
});

app.get("/status", (_req, res) => {
  res.status(200).json({
    message: "Chat server is running",
    connectedUsers,
    version: SERVER_VERSION,
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
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
      text: `${trimmedUsername} joined the chat`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      system: true,
    });
  });

  socket.on("message", (message) => {
    if (!message || typeof message !== "object") {
      return;
    }

    io.emit("message", message);
  });

  socket.on("typing", (isTyping: boolean) => {
    if (socket.data.username) {
      socket.broadcast.emit("user-typing", {
        username: socket.data.username,
        isTyping: Boolean(isTyping),
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});