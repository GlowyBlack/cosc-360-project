import userRepository from "../repositories/userRepository.js"
import bookRepository from "../repositories/bookRepository.js"


const UserService = {
    async updateFavourites(userId, bookId){
        const user = await userRepository.findById(userId);
        if (!user) throw new Error("User not found");

        const book = await bookRepository.findByID({ id: bookId });
        if (!book) throw new Error("Book not found");

        return await userRepository.updateFavourites(userId, bookId)
    }
}

export default UserService