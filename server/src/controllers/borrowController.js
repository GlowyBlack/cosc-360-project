import borrowService from "../services/borrowService.js"


const BorrowController = {
    async createBorrow(req, res){
        // TODO Create Borrow
        const {bookId, ownerId} = req.body;
        const requesterId = req.user.id; 

        let result = await borrowService.initiateBorrow(requesterId, ownerId, bookId);
        
        // status code 201
    },
}

export default BorrowController;

