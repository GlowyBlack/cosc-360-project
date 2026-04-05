import requestRepository from "../repositories/requestRepository.js"
/* 
TODO: 
    - Create method getUserRequests for /me route
*/
const RequestService = {
    async getAllBooks() {
        return await requestRepository.findAll();
    },
    
}

export default RequestService;