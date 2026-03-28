import book from "../models/book.js";
import "../models/user.js";


const BookRepository = {
    async createBook(data) {
        return await book.create(data);
    },

    async findAll() {
        return await book.find()
            .sort({ createdAt: -1 })
            .populate({ path: "bookOwner", select: "username" });
    },

    async findUserBooks(userID) {
        return await book.find({ bookOwner: userID }).sort({ createdAt: -1 });
    },

    async findByID(id){
        return await book.findById(id)
                         .populate({path: "bookOwner", select: "username"});
    }
};
export default BookRepository;
