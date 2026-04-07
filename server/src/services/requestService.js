import requestRepository from "../repositories/requestRepository.js"
/* 
TODO: 
    - Create method getUserRequests for /me route
*/
const RequestService = {

    async getAllRequests() {
        return requestRepository.getAllRequests();
    },

    async getUserRequests(userId){
        if (!userId) throw new Error("User ID is required");
        return requestRepository.findUserRequests(userId)

    }
    
}

export default RequestService;