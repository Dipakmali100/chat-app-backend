import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import AuthRouter from "./routes/auth";
import ChatRouter from "./routes/chat";
import ConnectionRouter from "./routes/connection";
import client from "./utils/prismaClient";
import getFriendList from "./utils/getFriendList";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(morgan("common"));

app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/chat", ChatRouter);
app.use("/api/v1/connection", ConnectionRouter);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const users: { [key: string]: string } = {};

io.on("connection", async (socket) => {
  // Assume users authenticate with a unique `userId`
  const userId = socket.handshake.query.userId as string | undefined;
  
  // Check if `userId` exists and is valid
  if (userId) {
    // Mark the user as online
    users[userId] = socket.id;
    console.log(`${userId} is online with socket id: ${socket.id}`);
    console.log("Online users: ", users);
    
    const friendList = await getFriendList(Number(userId));
    console.log(friendList);
    
    // Notify user his already online friends
    const alreadyOnlineUsers: {[key: string]: string}= {};
    friendList.forEach((friend: any) => {
      if (users[friend.secondUser.id]) {
        alreadyOnlineUsers[friend.secondUser.id] = users[friend.secondUser.id];
      }
    })
    console.log("Already online users: ", alreadyOnlineUsers);
    io.to(socket.id).emit("alreadyOnlineUsers", alreadyOnlineUsers);

    // Notify other users
    friendList.forEach((friend: any) => {
      if (users[friend.secondUser.id]) {
        io.to(users[friend.secondUser.id]).emit("newActiveUser", { userId, socketId: socket.id });
      }
    })
    

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`${userId} disconnected with socket id: ${socket.id}`);
      delete users[userId]; // Remove from online users
      delete alreadyOnlineUsers[userId];
      console.log("Online users: ", users);
      friendList.forEach((friend: any) => {
        if (users[friend.secondUser.id]) {
          io.to(users[friend.secondUser.id]).emit("removeActiveUser", { userId, socketId: socket.id });
        }
      })
    });
  } else {
    console.log("User ID is undefined");
    // You can decide how to handle cases where `userId` is missing
  }
});

export { io, users }; // Export both `io` and `users`