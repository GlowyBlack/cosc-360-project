import mongoose from 'mongoose';
import bookRepository from '../repositories/bookRepository.js';
import requestRepository from '../repositories/requestRepository.js';

const ExchangeService = {
    async initiateExchange({ requesterId, ownerId, bookId, offeredBookId }) {
        const targetBook = await bookRepository.findByID(bookId);
        const offeredBook = await bookRepository.findByID(offeredBookId);

        if (!targetBook || targetBook.status != "Available") {
            throw new Error("The requested book is currently not available.");
        }
        if (!offeredBook) {
            throw new Error("The book you are offering does not exist.");
        }
        if (offeredBook.ownerId.toString() != requesterId.toString()) {
            throw new Error("The book you are offering does not belong to you.");
        }
        if (targetBook.ownerId.toString() != ownerId.toString()) {
            throw new Error("The specified owner does not own the requested book.");
        }
        if (requesterId.toString() === ownerId.toString()) {
            throw new Error("You cannot exchange a book with yourself.");
        }
        let response;
        const session = await mongoose.startSession();
        try{
            response = await requestRepository.createExchange({ book: bookId, owner: ownerId, requester: requesterId, offeredBook: offeredBookId });
        } catch(err){

        } finally{

        }
        return response;
    },

    async acceptExchange({requestId, userId}){
        const request = await requestRepository.findRequestById(requestId);
        
        if(!request){
            throw new Error("The exchange request doesn't exist.");
        }

        if(request.type.toLowerCase() != "exchange"){
            throw new Error("The request isn't an exchange request.");
        }
        if(request.status.toLowerCase() != 'pending'){
            throw new Error("The exchange request isn't a pending request.");
        }
        if(request.bookOwner != userId){
            throw new Error("Unauthorized Access");
        }
        if(userId == request.requesterId){
            throw new Error("You cannot accept an exchange with yourself.");
        }

        const book = await bookRepository.findByID(request.bookId);
        if(!book){
            throw new Error("Your book no longer exists in database.");
        }

        const offeredBook = await bookRepository.findByID(request.offeredBookId);
        if(!offeredBook){
            throw new Error("The offered book no longer exists in database.");
        }

        if(!book.isAvailable){
            throw new Error("Your book is currently not available for trade.");
        }
        if(!offeredBook.isAvailable){
            throw new Error("The offered book is no longer available.");
        }

        if(offeredBook.bookOwner != request.requesterId){
            throw new Error("")
        }
        const requester = request.requesterId; // switch 
        const owner = request.bookOwner; //  switch offeredBookId to owner

        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                // Change Exchange to Accepted
                await requestRepository.acceptExchange(requestId, session);

                // Change book bookOwnerId to requesterId
                await bookRepository.updateBookOwner({id: request.bookId, newOwner: requester, session: session});

                // Change offeredBook bookOwnerId to ownerId
                await bookRepository.updateBookOwner({id: request.offeredBookId, newOwner: owner, session: session});
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
        const request = await requestRepository.findRequestById(requestId);
        
        if(!request){
            throw new Error("The exchange request doesn't exist.");
        }

        if(request.type.toLowerCase() != "exchange"){
            throw new Error("The request isn't an exchange request.");
        }
        if(request.status.toLowerCase() != 'pending'){
            throw new Error("The exchange request isn't a pending request.");
        }
        if(request.bookOwner != userId){
            throw new Error("Unauthorized Access");
        }
        if(userId == request.requesterId){
            throw new Error("You cannot reject an exchange with yourself.");
        }

        const book = await bookRepository.findByID(request.bookId);
        if(!book){
            throw new Error("Your book no longer exists in database.");
        }

        const offeredBook = await bookRepository.findByID(request.offeredBookId);
        if(!offeredBook){
            throw new Error("The offered book no longer exists in database.");
        }

        if(!book.isAvailable){
            throw new Error("Your book is currently not available for trade.");
        }
        if(!offeredBook.isAvailable){
            throw new Error("The offered book is no longer available.");
        }

        if(offeredBook.bookOwner != request.requesterId){
            throw new Error("")
        }
        const requester = request.requesterId; // switch 
        const owner = request.bookOwner; //  switch offeredBookId to owner

        const session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                // Change Exchange to Accepted
                await requestRepository.declineExchange(requestId, session);

                // Change book bookOwnerId to requesterId
                await bookRepository.updateBookOwner({id: request.bookId, newOwner: requester, session: session});

                // Change offeredBook bookOwnerId to ownerId
                await bookRepository.updateBookOwner({id: request.offeredBookId, newOwner: owner, session: session});
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
    }
}

export default ExchangeService;