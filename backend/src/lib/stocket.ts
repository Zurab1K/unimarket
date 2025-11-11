// src/lib/socket.ts
import { Server } from "socket.io";

let io: Server | null = null;

export default function initSocket(server: any) {
  if (!io) io = new Server(server);
  io.on("connection", (socket) => {
    socket.on("message", (msg) => io.emit("message", msg));
  });
  return io;
}
