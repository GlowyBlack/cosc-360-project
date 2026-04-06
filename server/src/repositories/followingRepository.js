import follow from "../models/following.js";

const FollowRepository = {
    async createFollow({followerId, followingId}){
        return follow.create({followerId, followingId})
    },

    async findFollow({ followerId, followingId }) {
        return follow.findOne({ followerId, followingId });
    },

    async removeFollow({followerId, followingId}){
        return follow.findOneAndDelete({ followerId, followingId });
    },

    async findFollowingsByUser({ userId }) {
        return follow
            .find({ followerId: userId })
            .populate({ path: "followingId", select: "username location profileImage bio" })
            .sort({ createdAt: -1 });
    },

    async findFollowingsByUsers({ followerId, followingIds }) {
        return follow.find({
            followerId,
            followingId: { $in: followingIds },
        });
    },

    async countFollowersByUser({ userId }) {
        return follow.countDocuments({ followingId: userId });
    },

    async countFollowingsByUser({ userId }) {
        return follow.countDocuments({ followerId: userId });
    },

    async findFollowersByUser({ userId }) {
        return follow
            .find({ followingId: userId })
            .populate({ path: "followerId", select: "username location profileImage bio" })
            .sort({ createdAt: -1 });
    },
}

export default FollowRepository;