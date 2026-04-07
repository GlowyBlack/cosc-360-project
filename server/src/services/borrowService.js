import bookRepository from '../repositories/bookRepository.js';
import requestRepository from '../repositories/requestRepository.js';
/* 
TODO: 
    - Initiate Borrow: use transaction
        - increment book book pending request count
        - make sure duration is passed in as well
    - Accept Borrow: uses transaction
    - Reject Borrow: use transaction
    - Mark Returned: 
*/
const BorrowService = {
    async initiateBorrow({ requesterId, ownerId, bookId }) {

    },
}

export default BorrowService;