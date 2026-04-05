import requestService from "../services/requestService.js"

const RequestController = {
    async getAllRequest(req, res){
        try {
            const requests = await requestService.getAllRequests();
            res.status(200).json(requests);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async getUserRequests(req, res){
        try{
            const userId = req.user?._id ?? req.user?.id;
            if(!userId) return res.status(401).json({ message: "Not authenticated" });

            const requests = await requestService.getUserRequests(userId);
            return res.status(200).json(requests);
        }catch (error){
            return res.status(500).json({ message: "Server Error", error: error.message });

        }
    },

}

export default RequestController;