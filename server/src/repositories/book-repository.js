import Book from "../models/book.js";
import "../models/user.js";


const BookRepository = {
    async createBook(data) {
        return await Book.create(data);
    },

    async findAll() {
        return await Book.find()
            .sort({ createdAt: -1 })
            .populate({ path: "bookOwner", select: "username" });
    },

    async findUserBooks(userID) {
        return await Book.find({ bookOwner: userID }).sort({ createdAt: -1 });
    },

    async findByID(id){
        return await Book.findById(id)
                         .populate({path: "bookOwner", select: "username"});
    }
};
export default BookRepository;
