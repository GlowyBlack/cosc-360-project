import mongoose from 'mongoose';
import bookRepository from '../repositories/bookRepository.js';
import requestRepository from '../repositories/requestRepository.js';
/* 
TODO:
    - Complete decline, cancel exchange
    - Edit acceptRequest:
        - change availability of book to unavailable after exchange completed
    - Potential ExchangeLog to keep track of exchange histories
    - Change offered book method to allow user to offer different book for exchange
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
                response = await requestRepository.createExchange({ 
                    book: bookId,
                    owner: ownerId,
                    requester: requesterId,
                    offeredBook: offeredBookId, 
                    session: session
                });
                await bookRepository.increaseRequestCount({id: bookId, session: session})
            });
            return response;
        } catch(err){
            console.error("Transaction failed:", err);
            throw err;
        } finally{
            session.endSession();
        }
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
                
                // TODO: Complete decline exchange
                // Change Exchange to Declined
                request = await requestRepository.declineExchange({ id: requestId, session: session });
                book = await bookRepository.decreaseRequestCount({ id: request.bookId, session: session })

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
        
    }
}

export default ExchangeService;