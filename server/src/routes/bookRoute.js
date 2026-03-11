const express = require('express');
const router = express.Router();
const bookController = require("../controlllers/bookController")

router.get('/', bookController.getAllBooks);

module.exports = router