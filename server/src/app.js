import db from './config/db.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bookRoute from './routes/book-route.js';
import authRoute from './routes/auth-route.js';
import { requireAuth } from "./middleware/auth.js";

dotenv.config()

const app = express();
db.startup()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {res.send('Book Buddy API is running...');});
app.use('/auth', authRoute);
app.use('/books', requireAuth, bookRoute);

const PORT = 5001;

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});