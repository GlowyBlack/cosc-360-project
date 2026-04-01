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
    },

    async updateBookOwner({id, newOwner, session=null}){
        return await book.findByIdAndUpdate(
            id,
           { $set: {bookOwner: newOwner}},
           {new: true},
           {session}
        );
    },

    async decreaseRequestCount({}){},
    
    async increaseRequestCount({}){},
    

    async updateStatus({id, session = null}){

    },

    async updateBook(data, bookId){
        book.findByIdAndUpdate(bookId,data)
    },

    async deleteBook(bookId){
        book.findByIdAndDelete(bookId);
    },

    async searchBook(searchTerm){
        const safeTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const query = {
            isAvailable: true,
            $or: [
            { bookTitle: { $regex: safeTerm, $options: "i" } },
            { bookAuthor: { $regex: safeTerm, $options: "i" } },
            { description: { $regex: safeTerm, $options: "i" } },
            { genre: { $regex: safeTerm, $options: "i" } },
            { onwerNote: { $regex: safeTerm, $options: "i" } }
            ]
        };

        return book.find(query);
    }
};
export default BookRepository;
