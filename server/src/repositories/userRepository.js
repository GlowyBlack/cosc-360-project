import User from "../models/user.js";

const UserRepository = {
  async findById(id) {
    return User.findById(id);
  },

  async findWishlistByUserId(id) {
    const user = await User.findById(id)
      .select("wishlist")
      .populate({
        path: "wishlist",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "bookOwner",
          select: "username location profileImage",
        },
      })
      .lean();

    if (!user) return null;
    return Array.isArray(user.wishlist) ? user.wishlist : [];
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

  async updateWishlist(userId, bookId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const wishlist = Array.isArray(user.wishlist) ? user.wishlist : [];
    user.wishlist = wishlist;

    const alreadyWishlisted = wishlist.some(
      (entry) => entry.toString() === bookId.toString()
    );

    if (alreadyWishlisted) {
      user.wishlist = wishlist.filter(
        (entry) => entry.toString() !== bookId.toString()
      );
    } else {
      user.wishlist = [...wishlist, bookId];
    }

    await user.save();
    return {
      user,
      wishlisted: !alreadyWishlisted,
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
