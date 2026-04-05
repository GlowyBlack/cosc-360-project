import requestRepository from "../repositories/requestRepository.js"

const RequestService = {
    async getAllBooks() {
        return await requestRepository.findAll();
    },
    
}

export default RequestService;