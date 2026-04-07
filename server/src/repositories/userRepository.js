import User from "../models/user.js";

const UserRepository = {
  async findById(id) {
    return User.findById(id);
  },

  async findOneByUsernameOrEmail(usernameNorm, emailNorm) {
    return User.findOne({
      $or: [{ username: usernameNorm }, { email: emailNorm }],
    }).lean();
  },

  async findByEmail(emailNorm) {
    return User.findOne({ email: emailNorm });
  },

  async createUser(data) {
    return User.create(data);
  },

  async updateFavourites(userId, bookId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const alreadyFavourited = user.favourites.some(
      (fav) => fav.toString() === bookId.toString()
    );

    if (alreadyFavourited) {
      user.favourites = user.favourites.filter(
        (fav) => fav.toString() !== bookId.toString()
      );
    } else {
      user.favourites.push(bookId);
    }

    await user.save();

    return {
      user,
      favourited: !alreadyFavourited,
    };
  }
};

export default UserRepository;
