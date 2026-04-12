import requestRepository from "../repositories/requestRepository.js";
import { httpError } from "../utils/httpError.js";

const RequestService = {
    async getAllRequests() {
        return requestRepository.getAllRequests();
    },

    async getUserRequests(userId) {
        if (!userId) throw httpError(400, "User ID is required");
        return requestRepository.findUserRequests(userId);
    },
};

export default RequestService;
