import express, { Request, Response } from "express";
import cors from "cors";
import { Server } from "socket.io";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.get('/', (req: Request, res: Response) => {
    res.json({
        "message":"Server is up and running..."
    });
});

// Start the server
const server = app.listen(5000, () => {
    console.log("Server is running on port 5000");
});

// Optionally set up Socket.io
// const io = new Server(server);
// io.on("connection", (socket) => {
//     console.log("A user connected");
//     socket.on("disconnect", () => {
//         console.log("User disconnected");
//     });
// });
