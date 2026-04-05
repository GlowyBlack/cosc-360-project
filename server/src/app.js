import db from './config/db.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import bookRoute from './routes/bookRoute.js';
import userRoute from './routes/userRoute.js';
import requestRoute from './routes/requestRoute.js';
import authRoute from './routes/authRoute.js';
import messageRoute from './routes/messageRoute.js';
import messageService from './services/messageService.js';
dotenv.config()

const app = express();
db.startup()

app.use(cors({
    origin: ["http://localhost:5173","http://localhost:4000"],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {res.send('Book Buddy API is running...');});
app.use('/auth', authRoute);
app.use('/books', bookRoute);
app.use('/user', userRoute);
app.use('/request', requestRoute);
app.use('/messages', messageRoute);

// wraped express in a plain http server so socket.io can share the same port
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:4000"],
        credentials: true
    }
});

io.on("connection", (socket) => {

    // frontend calls this when a user opens a chat so join puts them in a room named after the requestId
    // messages will only go to people in that specific conversation
    socket.on("join_thread", (requestId) => {
        socket.join(requestId);
    });

    socket.on("send_message", async ({ requestId, senderId, content }) => {
        try {
            const message = await messageService.send({ requestId, senderId, content });

            // broadcasts the saved message to everyone in this chat room
            io.to(requestId).emit("receive_message", message);
        } catch (e) {
            socket.emit("message_error", { error: e.message });
        }
    });

    socket.on("disconnect", () => {
        console.log("user disconnected from socket");
    });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on http://localhost:${PORT}`);
});