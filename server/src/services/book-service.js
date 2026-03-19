import BookRepository from "../repositories/book-repository.js"

const BookService= {
    async getAllBooks(){
        return await BookRepository.findAll();
    },

    async createBook(data){
        if(!data.book_title || !data.book_author){
            throw new Error("Title and author are required");
        }
        return await BookRepository.createBook(data);
    }
}

export default { BookService };