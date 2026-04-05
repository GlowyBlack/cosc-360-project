import borrowService from "../services/borrowService.js"


const BorrowController = {
    async createBorrow(req, res){
        // TODO Create Borrow
        const {bookId, ownerId} = req.body;
        const requesterId = req.user.id; 

        let result = await borrowService.initiateBorrow(requesterId, ownerId, bookId);
        
        // status code 201
    },

    async acceptBorrow(req, res){
        // TODO Accept Borrow
        const {bookId, ownerId} = req.body;
        const requesterId = req.user.id; 

        
        // status code 201
    },
    async declineBorrow(req, res){
        // TODO Decline Borrow
        const {bookId, ownerId} = req.body;
        const requesterId = req.user.id; 

        
        // status code 201
    },
}

export default BorrowController;

