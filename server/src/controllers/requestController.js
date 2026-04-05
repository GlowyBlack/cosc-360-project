import requestService from "../services/requestService.js"

const RequestController = {
    async getAllRequest(req, res){
        await requestService.getAllRequest()
        try {
            const requests = await requestService.getAllRequests();
            res.status(200).json(requests);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }
    },

    async getUserRequests(req, res){

    },
}

export default RequestController;