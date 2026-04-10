import User from "../models/user.js";

const UserRepository = {
  async findById(id) {
    return User.findById(id);
  },

  async findPublicById(id) {
    return User.findById(id)
      .select("username bio profileImage location role isSuspended")
      .lean();
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
  },

  async updateProfileById(id, updates) {
    return User.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: "after", runValidators: true },
    );
  },
};

export default UserRepository;
