import exchangeService from "../services/exchangeService.js"

const ExchangeController = {
    async createExchange(req, res){
        try{
            const {bookId, ownerId, offeredBookId} = req.body;
            const requesterId = req.user.id;

            if (!bookId || !ownerId) throw new Error("Book and owner are required.");

            if (!offeredBookId) throw new Error("Offered book is required for exchange.");
            let result = await exchangeService.initiateExchange({requesterId: requesterId, ownerId: ownerId,
                                                                 bookId: bookId, offeredBookId: offeredBookId});
            return res.status(201).json({success: true, data: result})
        } catch(error){
            return res.status(400).json({ message: error.message });
        }
    }
}

export default ExchangeController;
