import mongoose from 'mongoose';
import bookRepository from '../repositories/bookRepository.js';
import requestRepository from '../repositories/requestRepository.js';

const BorrowService = {
    async initiateBorrow({ requesterId, ownerId, bookId, returnBy }) {
        if (!returnBy) throw new Error("A return date is required.");

        const returnDate = new Date(returnBy);
        if (isNaN(returnDate.getTime())) throw new Error("Invalid return date.");
        if (returnDate <= new Date()) throw new Error("Return date must be in the future.");

        const book = await bookRepository.findByID({ id: bookId });
        if (!book) throw new Error("The requested book was not found.");
        if (!book.isAvailable) throw new Error("The requested book is currently not available.");

        const bookOwner = book.bookOwner?._id ?? book.bookOwner;
        if (!bookOwner || !bookOwner.equals(ownerId)) throw new Error("The specified owner does not own this book.");
        if (String(requesterId) === String(ownerId)) throw new Error("You cannot borrow your own book.");

        let response;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const existing = await requestRepository.findPendingByBookAndRequester({
                    bookId,
                    requesterId,
                    session,
                });
                if (existing) throw new Error("You've already requested to borrow this book.");

                response = await requestRepository.createBorrow({
                    book: bookId,
                    owner: ownerId,
                    requester: requesterId,
                    returnBy: returnDate,
                    session,
                });
                await bookRepository.increaseRequestCount({ id: bookId, session });
            });
            return response;
        } catch (err) {
            if (err?.code === 11000) throw new Error("You've already requested to borrow this book.");
            throw err;
        } finally {
            session.endSession();
        }
    },

    async acceptBorrow({ requestId, userId }) {
        const request = await requestRepository.findRequestById({ id: requestId });

        if (!request) throw new Error("The borrow request doesn't exist.");
        if (request.type.toLowerCase() !== "borrow") throw new Error("The request isn't a borrow request.");
        if (request.status.toLowerCase() !== "pending") throw new Error("Only pending borrow requests can be accepted.");

        const bookOwner = request.bookOwner?._id ?? request.bookOwner;
        if (!bookOwner.equals(userId)) throw new Error("Only the book owner can accept this request.");

        const session = await mongoose.startSession();
        let updatedRequest;
        try {
            await session.withTransaction(async () => {
                updatedRequest = await requestRepository.acceptExchange({ id: requestId, session });
                await bookRepository.resetRequestCount({ id: request.bookId, session });
            });
        } catch (err) {
            throw err;
        } finally {
            session.endSession();
        }
        return { success: true, message: "Borrow request accepted.", request: updatedRequest };
    },

    async declineBorrow({ requestId, userId }) {
        const request = await requestRepository.findRequestById({ id: requestId });

        if (!request) throw new Error("The borrow request doesn't exist.");
        if (request.type.toLowerCase() !== "borrow") throw new Error("The request isn't a borrow request.");
        if (request.status.toLowerCase() !== "pending") throw new Error("Only pending borrow requests can be declined.");

        const bookOwner = request.bookOwner?._id ?? request.bookOwner;
        if (!bookOwner.equals(userId)) throw new Error("Only the book owner can decline this request.");

        const session = await mongoose.startSession();
        let updatedRequest;
        try {
            await session.withTransaction(async () => {
                updatedRequest = await requestRepository.declineExchange({ id: requestId, session });
                await bookRepository.decreaseRequestCount({ id: request.bookId, session });
            });
        } catch (err) {
            throw err;
        } finally {
            session.endSession();
        }
        return { success: true, message: "Borrow request declined.", request: updatedRequest };
    },

    async markBorrowReturned({ requestId, userId }) {
        const requestDoc = await requestRepository.findRequestById({ id: requestId });

        if (!requestDoc) throw new Error("The borrow request doesn't exist.");
        if (String(requestDoc.type).toLowerCase() !== "borrow") {
            throw new Error("The request isn't a borrow request.");
        }
        if (String(requestDoc.status).toLowerCase() !== "accepted") {
            throw new Error("Only an active borrow can be marked as returned.");
        }

        const bookOwner = requestDoc.bookOwner?._id ?? requestDoc.bookOwner;
        if (!bookOwner.equals(userId)) {
            throw new Error("Only the book owner can mark this borrow as returned.");
        }

        const updatedRequest = await requestRepository.markBorrowReturned({ id: requestId });
        if (!updatedRequest) throw new Error("The borrow request doesn't exist.");

        return {
            success: true,
            message: "Borrow marked as returned.",
            request: updatedRequest,
        };
    },
};

export default BorrowService;