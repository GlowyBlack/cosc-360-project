// TODO
import request from "../models/request.js";
import "../models/user.js";

const RequestRepository = {
    async createExchange({book, owner, offeredBook, requester }){
        return await request.create({bookId: book, bookOwner: owner, 
                                    requesterId: requester, type: "Exchange", 
                                    offeredBookId: offeredBook, status:"Pending"});
    },

    async createBorrow(book, owner, requester){
        return await request.create({bookId: book, bookOwner: owner, 
                                    requesterId: requester, type: "Borrow", 
                                    status:"Pending"});
    },
}

export default RequestRepository;
// requesterId, ownerId, bookId, offeredBookId