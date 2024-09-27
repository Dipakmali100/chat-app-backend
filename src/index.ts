import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app=express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
}));

const server = http.createServer(app);

server.listen(5000, () => {
    console.log("Server running on port 5000");
})

const io= new Server(server,{
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
})
const users: { [key: string]: string } = {};

io.on('connection', (socket) => {
    // Assume users authenticate with a unique `userId`
    const userId = socket.handshake.query.userId as string | undefined;
  
    // Check if `userId` exists and is valid
    if (userId) {
      // Mark the user as online
      users[userId] = socket.id;
      console.log(`${userId} is online`);
  
      // Notify other users (you can customize this logic)
      socket.broadcast.emit('userStatus', { userId: userId, status: 'online' });
  
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`${userId} disconnected`);
        delete users[userId]; // Remove from online users
        socket.broadcast.emit('userStatus', { userId: userId, status: 'offline' });
      });
    } else {
      console.log('User ID is undefined');
      // You can decide how to handle cases where `userId` is missing
    }
  });