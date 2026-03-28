import exchangeService from "../services/exchange-service.js"
import borrowService from "../services/borrow-service.js"

export const createRequest = async(req, res) => {
    try{
        const { type, bookId, ownerId, offeredBookId} = req.body;
        const requesterId = req.user.id; 

        let result;
        if(type.toLowerCase() == 'borrow'){
            result = await borrowService.initiateBorrow(requesterId, ownerId, bookId);
        } else if (type.toLowerCase() == 'exchange'){
            if (!offeredBookId) throw new Error("Offered book is required for exchange.");
            result = await exchangeService.initiateExchange(requesterId, ownerId, bookId, offeredBookId);
        }
        res.status(201).json({ success: true, data: result });
    }catch (error){
        res.status(400).json({ message: error.message });
    }
};