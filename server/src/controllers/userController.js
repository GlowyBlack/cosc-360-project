import userService from "../services/userService.js"


const UserController = {
    async updateFavourites(req, res){
        try {
            const userId = req.user?._id ?? req.user?.id;
            const { bookId } = req.params;
            const favourites = await userService.updateFavourites(userId, bookId);
            return res.status(200).json(favourites);
        } catch (error) {
            const msg = error.message;

            if(msg === "Book not found" || msg == "User not found") {
                return res.status(404).json({message: msg});
            }
            if(msg === "Book ID is required." || msg === "UserID is required") {
                return res.status(400).json({message: msg});
            }
            res.status(500).json({message: "Server Error", error: msg});
        }
    }
};
export default UserController;