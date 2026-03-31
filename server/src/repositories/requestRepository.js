// TODO
import request from "../models/request.js";
import "../models/user.js";

const RequestRepository = {

    async findRequestById({id}){
        return await request.findById(id);
    },

    async createExchange({book, owner, offeredBook, requester }){
        return await request.create({bookId: book, bookOwner: owner, 
                                    requesterId: requester, type: "Exchange", 
                                    offeredBookId: offeredBook, status:"Pending"});
    },

    async acceptExchange({id, session = null}){
        return await request.findByIdAndUpdate(
            id,
            { $set: {status: 'Accepted'}},
            {new: true},
            {session}
        )
    },

    async createBorrow({book, owner, requester}){
        return await request.create({bookId: book, bookOwner: owner, 
                                    requesterId: requester, type: "Borrow", 
                                    status:"Pending"});
    },    
}

export default RequestRepository;
