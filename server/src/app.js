import db from './config/db.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bookRoute from './routes/bookRoute.js';
import userRoute from './routes/userRoute.js';
import requestRoute from './routes/requestRoute.js';
import authRoute from './routes/authRoute.js';
import { requireAuth } from "./middleware/auth.js";

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
app.use('/books', requireAuth, bookRoute);
app.use('/user', userRoute);
app.use('/request', requestRoute);

const PORT = 5001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started on http://localhost:${PORT}`);
});