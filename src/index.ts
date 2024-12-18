import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import morgan from "morgan";
import AuthRouter from "./routes/auth";
import ChatRouter from "./routes/chat";
import ConnectionRouter from "./routes/connection";
import PaymentRouter from "./routes/payment";
import TrafficRouter from "./routes/traffic";
import getFriendsList from "./utils/getFriendsList";
import axios from "axios";

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.0.107:5173",
      "https://chatnow.dipakmali.tech",
      "https://www.chatnow.dipakmali.tech",
    ],
    // origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(morgan("common"));

app.use("/api/v1/auth", AuthRouter);
app.use("/api/v1/chat", ChatRouter);
app.use("/api/v1/connection", ConnectionRouter);
app.use("/api/v1/payment", PaymentRouter);
app.use("/api/v1/traffic", TrafficRouter);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Function to keep the server awake
const keepServerAwake = () => {
  setInterval(async () => {
    try {
      await axios.get(`https://chatnow-backend.dipakmali.tech`); // Adjust this URL if needed
      console.log("Pinged server to keep it awake");
    } catch (error) {
      console.error("Error pinging server:", error);
    }
  }, 10 * 60 * 1000); // 10 minutes in milliseconds
};

// Call the function to start pinging
keepServerAwake();

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://192.168.0.107:5173",
      "https://chatnow.dipakmali.tech",
      "https://www.chatnow.dipakmali.tech",
    ],
    // origin: "*",
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

    const friendList = await getFriendsList(Number(userId));
    console.log(friendList);

    // Notify user his already online friends
    const alreadyOnlineUsers: { [key: string]: string } = {};
    friendList.forEach((friend: any) => {
      if (users[friend.secondUser.id]) {
        alreadyOnlineUsers[friend.secondUser.id] = users[friend.secondUser.id];
      }
    });
    console.log("Already online users: ", alreadyOnlineUsers);
    io.to(socket.id).emit("alreadyOnlineUsers", alreadyOnlineUsers);

    // Notify other users
    friendList.forEach((friend: any) => {
      if (users[friend.secondUser.id]) {
        io.to(users[friend.secondUser.id]).emit("newActiveUser", {
          userId,
          socketId: socket.id,
        });
      }
    });

    // Handle getAlreadyOnlineUsers
    socket.on("getAlreadyOnlineUsers", async(data) => {
      const userfriendList = await getFriendsList(Number(data.userId));
      const alreadyOnlineUsers: { [key: string]: string } = {};
      userfriendList.forEach((friend: any) => {
        if (users[friend.secondUser.id]) {
          alreadyOnlineUsers[friend.secondUser.id] =
          users[friend.secondUser.id];
        }
      });
      io.to(data.socketId).emit("alreadyOnlineUsers", alreadyOnlineUsers);
    });

    // Handle chat and friend list updates
    socket.on("sendMessage", (data) => {
      if (users[data.receiverId]) {
        io.to(users[data.receiverId]).emit("newMessage", {
          senderId: data.senderId,
          isNewMessage: data.isNewMessage,
          isDisconnect: data.isDisconnect,
        });
        setTimeout(() => {
          io.to(users[data.senderId]).emit("newMessage", {
            senderId: data.receiverId,
            isNewMessage: false,
          });
        }, 1000);
        console.log(
          "Message sent to: ",
          data.receiverId,
          " with socket id: ",
          users[data.receiverId]
        );
      }
    });

    // Handle message delete event
    socket.on("deleteMessage", (data) => {
      if (users[data.receiverId]) {
        setTimeout(() => {
          io.to(users[data.receiverId]).emit("deleteMessage", {
            senderId: data.senderId,
            messageId: data.messageId,
          });
          console.log(
            "Message deleted from: ",
            data.receiverId,
            " with socket id: ",
            users[data.receiverId]
          );
        }, 1000);
      }
    });

    // Handle chatOpened event
    socket.on("chatOpened", (data) => {
      console.log(
        "Chat opened with: ",
        data.receiverId,
        " with socket id: ",
        users[data.receiverId]
      );
      if (users[data.receiverId]) {
        setTimeout(() => {
          io.to(users[data.receiverId]).emit("newMessage", {
            senderId: data.senderId,
            isNewMessage: false,
          });
        }, 1000);
      }
    });

    // Handle typing event
    socket.on("typing", (data) => {
      if (users[data.receiverId]) {
        io.to(users[data.receiverId]).emit("typing", {
          senderId: data.senderId,
          isTyping: data.isTyping,
        });
        console.log(
          "Typing event sent to: ",
          data.receiverId,
          " with socket id: ",
          users[data.receiverId]
        );
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`${userId} disconnected with socket id: ${socket.id}`);
      delete users[userId]; // Remove from online users
      delete alreadyOnlineUsers[userId];
      console.log("Online users: ", users);
      friendList.forEach((friend: any) => {
        if (users[friend.secondUser.id]) {
          io.to(users[friend.secondUser.id]).emit("removeActiveUser", {
            userId,
            socketId: socket.id,
          });
        }
      });
    });
  } else {
    console.log("User ID is undefined");
    // You can decide how to handle cases where `userId` is missing
  }
});

export { io, users }; // Export both `io` and `users`
