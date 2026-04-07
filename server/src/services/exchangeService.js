import mongoose from 'mongoose';
import bookRepository from '../repositories/bookRepository.js';
import requestRepository from '../repositories/requestRepository.js';
/* 
TODO:
    - Potential ExchangeLog to keep track of exchange histories
*/

const ExchangeService = {
    async initiateExchange({ requesterId, ownerId, bookId, offeredBookId }) {
        const targetBook = await bookRepository.findByID({id: bookId});
        const offeredBook = await bookRepository.findByID({id: offeredBookId});

        if (!targetBook) throw new Error("The requested book was not found.");
        if(!targetBook.isAvailable) throw new Error("The requested book is currently not available.");
        if (!offeredBook) throw new Error("The book you are offering does not exist.");

        
        const offeredOwner = offeredBook.bookOwner?._id ?? offeredBook.bookOwner;
        if (!offeredOwner || !offeredOwner.equals(requesterId)) throw new Error("The book you are offering does not belong to you.");

        const targetOwner = targetBook.bookOwner?._id ?? targetBook.bookOwner;
        if (!targetOwner || !targetOwner.equals(ownerId)) throw new Error("The specified owner does not own the requested book.");
        if (requesterId.equals(ownerId)) throw new Error("You cannot exchange a book with yourself.")

        let response;
        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                const existing = await requestRepository.findPendingByBookAndRequester({
                    bookId,
                    requesterId,
                    session,
                });
                if (existing) {
                    throw new Error("You've already requested this book.");
                }
                response = await requestRepository.createExchange({ 
                    book: bookId,
                    owner: ownerId,
                    requester: requesterId,
                    offeredBook: offeredBookId, 
                    session
                });
                await bookRepository.increaseRequestCount({id: bookId, session})
            });
            return response;
        } catch(err){
            if (err?.code === 11000) {
                throw new Error("You've already requested this book.");
            }
            console.error("Transaction failed:", err);
            throw err;
        } finally{
            session.endSession();
        }
    },

    async editExchangeOfferedBook({ requestId, userId, offeredBookId }) {
        let request = await requestRepository.findRequestById({ id: requestId });

        if (!request) throw new Error("The exchange request doesn't exist.");
        if (String(request.type).toLowerCase() !== "exchange") {
            throw new Error("The request isn't an exchange request.");
        }
        if (String(request.status).toLowerCase() !== "pending") throw new Error("Only pending exchange requests can be edited.");

        const requesterRaw = request.requesterId?._id ?? request.requesterId;
        if (String(requesterRaw) !== String(userId)) throw new Error("Only the person who proposed the exchange can change the offered book.");
        if (String(offeredBookId) === String(request.offeredBookId)) {
            return {
                success: true,
                message: "No change to offered book.",
                request: request,
            };
        }

        const newOffered = await bookRepository.findByID({ id: offeredBookId });
        if (!newOffered) throw new Error("The book you are offering does not exist.");

        const newOfferedOwner = newOffered.bookOwner?._id ?? newOffered.bookOwner;
        if (!newOfferedOwner || !newOfferedOwner.equals(requesterRaw)) throw new Error("The book you are offering does not belong to you.");
        if (!newOffered.isAvailable) throw new Error("The book you are offering is not available for trade.");

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const updated = await requestRepository.switchOfferedBook({
                    id: requestId,
                    newBookId: offeredBookId,
                    session,
                });
                if (!updated) {
                    throw new Error("Could not update the exchange request.");
                }
            });
        } finally {
            session.endSession();
        }

        request = await requestRepository.findRequestById({ id: requestId });
        return {
            success: true,
            message: "Offered book updated.",
            request: request,
        };
    },

    async acceptExchange({requestId, userId}){
        const request = await requestRepository.findRequestById({id: requestId});
        
        if(!request) throw new Error("The exchange request doesn't exist.");
        if(request.type.toLowerCase() != "exchange") throw new Error("The request isn't an exchange request.");
        if(request.status.toLowerCase() != 'pending') throw new Error("The exchange request isn't a pending request.");
        if(!request.bookOwner.equals(userId)) throw new Error("Unauthorized Access");
        if(userId.equals(request.requesterId)) throw new Error("You cannot accept an exchange with yourself.");

        const session = await mongoose.startSession();
        let book;
        let offeredBook;
        try{
            await session.withTransaction(async () => {
                book = await bookRepository.findByID({id: request.bookId});
                const bookId =  request.bookId;

                offeredBook = await bookRepository.findByID({id: request.offeredBookId});
                const offeredBookId = request.offeredBookId;

                if(!book || !offeredBook) throw new Error("One of the book no longer exists in database.");
                if(!book.isAvailable || !offeredBook.isAvailable) throw new Error("One of the book is currently not available for trade.");
                    
                if(!offeredBook.bookOwner.equals(request.requesterId)) throw new Error("The offered book doesn't belong to the requester anymore.");
                const requester = request.requesterId; // switch
                const owner = request.bookOwner; //  switch offeredBookId to owner

                // Change Exchange to Accepted
                await requestRepository.acceptExchange({id: requestId, session: session});

                // Drop every other pending request that references either book (borrow or exchange)
                await requestRepository.cancelAllRequestsForBook({ id: request.bookId, session, });
                await requestRepository.cancelAllRequestsForBook({ id: request.offeredBookId, session, });

                // Change book bookOwnerId to requesterId
                await bookRepository.updateBookOwner({id: request.bookId, newOwner: requester, session: session});

                // Change offeredBook bookOwnerId to ownerId
                await bookRepository.updateBookOwner({id: request.offeredBookId, newOwner: owner, session: session});
                
                await bookRepository.toggleAvailability({ bookId: bookId, session: session })
                await bookRepository.toggleAvailability({ bookId:  offeredBookId, session: session })
            });
            console.log("Transaction successful");
        }catch(error){
            console.error("Transaction failed:", error);
            throw error
        }finally{
            session.endSession()
        }
        return {
            success: true,
            message: "Exchange successful! Books have been swapped.",
            request: request,
            books: {
                receivedBook: offeredBook,
                sentBook: book
            }
        };
    },

    async declineExchange({requestId, userId}){
        let request = await requestRepository.findRequestById({id: requestId});
        
        if(!request) throw new Error("The exchange request doesn't exist.");
        if(request.type.toLowerCase() != "exchange") throw new Error("The request isn't an exchange request.");
        if(request.status.toLowerCase() != 'pending') throw new Error("The exchange request isn't a pending request.");
        if(!request.bookOwner.equals(userId))throw new Error("Unauthorized Access");

        if(userId == request.requesterId) throw new Error("You cannot reject an exchange with yourself.");
        let book;
        let offeredBook;
        
        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                book = await bookRepository.findByID({id: request.bookId});
                offeredBook = await bookRepository.findByID({id: request.offeredBookId});
                if(!book || !offeredBook) throw new Error("One of the book no longer exists in database.");
                
                if(!offeredBook.bookOwner.equals(request.requesterId)) throw new Error("The offered book doesn't belong to the requester anymore.");
            
                request = await requestRepository.declineExchange({ id: requestId, session: session });
                book = await bookRepository.decreaseRequestCount({ id: request.bookId, session: session });
            });
            console.log("Transaction successful");
        }catch(error){
            console.error("Transaction failed:", error);
            throw error
        }finally{
            session.endSession()
        }
        return {
            success: true,
            message: "Exchange rejected.",
            request: request,
            books: {
                requestedBook: book,
                offeredBook: offeredBook
            }
        };
        
    },

    async cancelExchange({requestId, userId}){
        let request = await requestRepository.findRequestById({id: requestId});
        
        if(!request) throw new Error("The exchange request doesn't exist.");
        if(request.type.toLowerCase() != "exchange") throw new Error("The request isn't an exchange request.");
        if(request.status.toLowerCase() != 'pending') throw new Error("The exchange request isn't a pending request.");

        const requesterRaw = request.requesterId?._id ?? request.requesterId;
        if (String(requesterRaw) !== String(userId)) {
            throw new Error("Only the person who proposed the exchange can cancel it.");
        }

        let book;
        let offeredBook;
        
        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                book = await bookRepository.findByID({id: request.bookId});
                offeredBook = await bookRepository.findByID({id: request.offeredBookId});
                if(!book || !offeredBook) throw new Error("One of the book no longer exists in database.");
                
                if(!offeredBook.bookOwner.equals(request.requesterId)) throw new Error("The offered book doesn't belong to the requester anymore.");
            
                request = await requestRepository.cancelRequest({ id: requestId, session: session });
                book = await bookRepository.decreaseRequestCount({ id: request.bookId, session: session });
            });
            console.log("Transaction successful");
        }catch(error){
            console.error("Transaction failed:", error);
            throw error
        }finally{
            session.endSession()
        }
        return {
            success: true,
            message: "Exchange cancelled.",
            request: request,
            books: {
                requestedBook: book,
                offeredBook: offeredBook
            }
        };
    },


}

export default ExchangeService;