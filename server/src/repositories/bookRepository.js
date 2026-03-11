// const Book = require('../models/Book');

const findAll = async () => {
    return [
        { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", owner:"Jovan Kalirai",  status: "Available" },
        { id: 2, title: "1984", author: "George Orwell", owner: "Armaan Cheema", status: "Borrowed" }
    ];
    
};

module.exports = { findAll };