import express from "express";
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "node:url"; // Fixed capitalization here
import { dirname, join } from "node:path";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Fixed capitalization here as well
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => res.sendFile(join(__dirname, "index.html")));

const port = 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));