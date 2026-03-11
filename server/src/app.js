const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {res.send('Book Buddy API is running...');});
app.use('/books', require('./routes/bookRoute'));

const PORT = 5000;

app.listen(PORT, () => {console.log(`Server started on http://localhost:${PORT}`);});