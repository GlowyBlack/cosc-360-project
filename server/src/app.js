import db from './config/db.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'

import adminRoute from './routes/adminRoute.js';
import authRoute from './routes/authRoute.js';
import bookRoute from './routes/bookRoute.js';
import commentRoute from './routes/commentRoute.js';
import messageRoute from './routes/messageRoute.js';
import messageService from './services/messageService.js';
import postRoute from './routes/postRoute.js';
import requestRoute from './routes/requestRoute.js';
import reviewRoute from './routes/reviewRoute.js';
import reportRoute from './routes/reportRoute.js';
import userRoute from './routes/userRoute.js';

dotenv.config()

const app = express();
db.startup()

app.use(cors({
    origin: ["http://localhost:5173","http://localhost:4000"],
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {res.send('Book Buddy API is running...');});
app.use('/admin', adminRoute);
app.use('/auth', authRoute);
app.use('/books', bookRoute);
app.use('/comments', commentRoute);
app.use('/messages', messageRoute);
app.use('/posts', postRoute);
app.use('/requests', requestRoute);
app.use('/reviews', reviewRoute);
app.use('/reports', reportRoute);
app.use('/user', userRoute);

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:4000"],
        credentials: true
    }
});

io.on("connection", (socket) => {

    socket.on("join_thread", (requestId) => {
        socket.join(requestId);
    });

    socket.on("send_message", async ({ requestId, senderId, content }) => {
        try {
            const message = await messageService.send({ requestId, senderId, content });
            io.to(requestId).emit("receive_message", message);
        } catch (e) {
            socket.emit("message_error", { error: e.message });
        }
    });

    socket.on("join_user_room", (userId) => {
        socket.join(userId);
    });

    socket.on("new_request", ({ ownerId }) => {
        io.to(ownerId).emit("request_update");
    });

    socket.on("request_status_changed", ({ requesterId, ownerId }) => {
        if (requesterId) io.to(requesterId).emit("request_update");
        if (ownerId) io.to(ownerId).emit("request_update");
    });

    socket.on("book_update", () => {
        io.emit("book_update");
    });

    socket.on("disconnect", () => {
        console.log("user disconnected from socket");
    });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on http://localhost:${PORT}`);
});