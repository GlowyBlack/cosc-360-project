import mongoose from "mongoose";
import bookRepository from "../repositories/bookRepository.js";
import requestRepository from "../repositories/requestRepository.js";
import { httpError } from "../utils/httpError.js";

const BorrowService = {
    async initiateBorrow({ requesterId, ownerId, bookId, returnBy }) {
        if (!returnBy) throw httpError(400, "A return date is required.");

        const returnDate = new Date(returnBy);
        if (isNaN(returnDate.getTime())) throw httpError(400, "Invalid return date.");
        if (returnDate <= new Date()) throw httpError(400, "Return date must be in the future.");

        const book = await bookRepository.findByID({ id: bookId });
        if (!book) throw httpError(404, "The requested book was not found.");
        if (!book.isAvailable) throw httpError(400, "The requested book is currently not available.");

        const bookOwner = book.bookOwner?._id ?? book.bookOwner;
        if (!bookOwner || !bookOwner.equals(ownerId)) {
            throw httpError(400, "The specified owner does not own this book.");
        }
        if (String(requesterId) === String(ownerId)) {
            throw httpError(400, "You cannot borrow your own book.");
        }

        let response;
        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                const existing = await requestRepository.findPendingByBookAndRequester({
                    bookId,
                    requesterId,
                    session,
                });
                if (existing) throw httpError(409, "You've already requested to borrow this book.");

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
            if (err?.code === 11000) throw httpError(409, "You've already requested to borrow this book.");
            throw err;
        } finally {
            session.endSession();
        }
    },

    async acceptBorrow({ requestId, userId }) {
        const request = await requestRepository.findRequestById({ id: requestId });

        if (!request) throw httpError(404, "The borrow request doesn't exist.");
        if (request.type.toLowerCase() !== "borrow") throw httpError(400, "The request isn't a borrow request.");
        if (request.status.toLowerCase() !== "pending") {
            throw httpError(400, "Only pending borrow requests can be accepted.");
        }

        const bookOwner = request.bookOwner?._id ?? request.bookOwner;
        if (!bookOwner.equals(userId)) throw httpError(403, "Only the book owner can accept this request.");

        const bookId = request.bookId?._id ?? request.bookId;

        const session = await mongoose.startSession();
        let updatedRequest;
        try {
            await session.withTransaction(async () => {
                updatedRequest = await requestRepository.acceptExchange({ id: requestId, session });
                await bookRepository.resetRequestCount({ id: bookId, session });
                await bookRepository.setBookAvailability({ id: bookId, isAvailable: false, session });
                await requestRepository.cancelAllRequestsForBook({ id: bookId, session });
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

        if (!request) throw httpError(404, "The borrow request doesn't exist.");
        if (request.type.toLowerCase() !== "borrow") throw httpError(400, "The request isn't a borrow request.");
        if (request.status.toLowerCase() !== "pending") {
            throw httpError(400, "Only pending borrow requests can be declined.");
        }

        const bookOwner = request.bookOwner?._id ?? request.bookOwner;
        if (!bookOwner.equals(userId)) throw httpError(403, "Only the book owner can decline this request.");

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

        if (!requestDoc) throw httpError(404, "The borrow request doesn't exist.");
        if (String(requestDoc.type).toLowerCase() !== "borrow") {
            throw httpError(400, "The request isn't a borrow request.");
        }
        if (String(requestDoc.status).toLowerCase() !== "accepted") {
            throw httpError(400, "Only an active borrow can be marked as returned.");
        }

        const bookOwner = requestDoc.bookOwner?._id ?? requestDoc.bookOwner;
        if (!bookOwner.equals(userId)) {
            throw httpError(403, "Only the book owner can mark this borrow as returned.");
        }

        const bookId = requestDoc.bookId?._id ?? requestDoc.bookId;

        const session = await mongoose.startSession();
        let updatedRequest;
        try {
            await session.withTransaction(async () => {
                updatedRequest = await requestRepository.markBorrowReturned({ id: requestId, session });
                if (!updatedRequest) {
                    throw httpError(404, "The borrow request doesn't exist.");
                }
                await bookRepository.setBookAvailability({ id: bookId, isAvailable: true, session });
            });
        } finally {
            session.endSession();
        }

        return {
            success: true,
            message: "Borrow marked as returned.",
            request: updatedRequest,
        };
    },
};

export default BorrowService;
