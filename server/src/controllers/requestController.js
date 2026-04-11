import requestService from "../services/requestService.js";
import { sendServiceError } from "../utils/httpError.js";

const RequestController = {
    async getAllRequest(req, res) {
        try {
            const requests = await requestService.getAllRequests();
            res.status(200).json(requests);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },

    async getUserRequests(req, res) {
        try {
            const userId = req.user?._id ?? req.user?.id;
            if (!userId) return res.status(401).json({ message: "Not authenticated" });

            const requests = await requestService.getUserRequests(userId);
            return res.status(200).json(requests);
        } catch (error) {
            return sendServiceError(res, error);
        }
    },
};

export default RequestController;
