import request from "../models/request.js";
import "../models/user.js";

const RequestRepository = {

    async getAllRequests(){
        return await request.find()
            .sort({ createdAt: -1 })
            .populate({ path: "bookOwner", select: "username" })
            .populate({ path: "requesterId", select: "username" })
            .populate({ path: "bookId", select: "bookTitle"})
            .populate({ path: "offeredBookId", select: "bookTitle"})
            .sort({ createdAt: -1 });
    },

    async findRequestById({ id, session = null }) {
        let q = request.findById(id);
        if (session) q = q.session(session);
        return await q.exec();
    },

    async findPendingByBookAndRequester({ bookId, requesterId, session = null }) {
        let q = request.findOne({
                bookId,
                requesterId,
                status: "Pending",
            });
        if (session) q = q.session(session);
        return await q.exec();
    },

    async findUserRequests(userId) {
        return await request.find({
            $or: [
                { bookOwner: userId },
                { requesterId: userId },
            ]})
            .populate({ path: "bookOwner", select: "username" })
            .populate({ path: "requesterId", select: "username" })
            .populate({ path: "bookId", select: "bookTitle"})
            .populate({ path: "offeredBookId", select: "bookTitle"})
            .sort({ createdAt: -1 });
    },

    async createExchange({book, owner, offeredBook, requester, session = null}){
        return await request.create(
            [{bookId: book, bookOwner: owner,
              requesterId: requester, type: "Exchange",
              offeredBookId: offeredBook, status:"Pending"}], 
              {session}
            );
    },

    async switchOfferedBook({ id, newBookId, session = null }) {
        return await request.findByIdAndUpdate(
            id,
            { $set: { offeredBookId: newBookId } },
            {
                returnDocument: "after",
                session,
                runValidators: true,
            },
        );
    },

    async acceptExchange({id, session = null}){
        return await request.findByIdAndUpdate(
            id,
            { $set: {status: 'Accepted'}},
            { returnDocument: "after", session }
        )
    },

    async declineExchange({id, session = null}){
                return await request.findByIdAndUpdate(
            id,
            { $set: {status: 'Declined'}},
            { returnDocument: "after", session }
        )
    },

    async cancelRequest({id, session = null}){
        return await request.findByIdAndUpdate(
            id,
            { $set: {status: 'Cancelled'}},
            { returnDocument: "after", session }
        )
    },

    async cancelAllRequestsForBook({id, session = null}){
        return await request.updateMany(
            { 
                $or: [
                    { bookId: id },
                    { offeredBookId: id }
                ],
                status: "Pending" 
            },
            { 
                $set: { status: "Cancelled" } 
            },
            { session }
        );
    },

    async createBorrow({book, owner, requester}){
        return await request.create({bookId: book, bookOwner: owner,
                                    requesterId: requester, type: "Borrow",
                                    status:"Pending"});
    },
}

export default RequestRepository;
