import book from "../models/book.js";
import "../models/user.js";


const BookRepository = {
    async createBook(data) {
        return await book.create(data);
    },

    async findAll() {
        return await book.find()
            .sort({ createdAt: -1 })
            .populate({ path: "bookOwner", select: "username location profileImage" });
    },

    async findUserBooks(userID) {
        return await book.find({ bookOwner: userID }).sort({ createdAt: -1 });
    },

    async findByID({ id, lean = false, session = null }) {
        let q = book.findById(id)
            .populate({ path: "bookOwner", select: "username location profileImage" });

        if (session) {
            q = q.session(session);
        }
        if (lean) {
            q = q.lean();
        }

        return await q;
    },

    async updateBookOwner({id, newOwner, session=null}){
        return await book.findByIdAndUpdate(
            id,
           { $set: {
                bookOwner: newOwner,
                pendingRequestCount: 0.
                }
            },
           { returnDocument: "after", session }
        );
    },

    async decreaseRequestCount({id, session = null}){

    },
    async increaseRequestCount({id, session = null}){
        return await book.findByIdAndUpdate(
            id, 
            { $inc: { pendingRequestCount: 1 } }, 
            { 
                returnDocument: "after",        
                session,          
                runValidators: true 
            }
        );
    },


    async updateStatus({id, session = null}){

    },

    async toggleAvailability(bookId) {
        return book.findByIdAndUpdate(
            bookId,
            [{ $set: { isAvailable: { $not: "$isAvailable" } } }],
            { 
                new: true,
                lean: true,
                runValidators: false
            }
        );
    },

    async updateBook(bookId, updates) {
        return book.findByIdAndUpdate(
            bookId,
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        );
    },

    async deleteBook(bookId) {
        return book.findByIdAndDelete(bookId);
        // TODO: Delete anything refering to that bookid in other services
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
            { ownerNote: { $regex: safeTerm, $options: "i" } }
            ]
        };

        return book
            .find(query)
            .sort({ createdAt: -1 })
            .populate({ path: "bookOwner", select: "username location" });
    },


};
export default BookRepository;
