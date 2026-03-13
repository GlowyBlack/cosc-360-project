import bookRepository from "../repositories/book-repository.js"

const getAllBooks = async () => {
    const books = await bookRepository.findAll();
    
    return books;
};

export default { getAllBooks };