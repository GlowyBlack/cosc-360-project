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
        return await requestRepository.createExchange({ book: bookId, owner: ownerId, requester: requesterId, offeredBook: offeredBookId });
    },
}

export default ExchangeService;