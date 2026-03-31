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
};

export default UserRepository;
