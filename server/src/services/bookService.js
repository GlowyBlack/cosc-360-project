const bookRepository = require('../repositories/bookRepository');

const getAllBooks = async () => {
    const books = await bookRepository.findAll();
    
    return books;
};

module.exports = { getAllBooks };