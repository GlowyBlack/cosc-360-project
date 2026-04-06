import followService from "../services/followService.js";

const FollowController = {
    async followUser(req, res) {
        try {
            const followingId = req.params.id;
            const followerId = req.user?.id ?? req.user?._id;
            if (!followerId) return res.status(401).json({ message: "Unauthorized" });

            const result = await followService.follow(followerId, followingId);
            return res.status(201).json(result);
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (
                msg === "followerId and followingId are required" ||
                msg === "Invalid user id" ||
                msg === "You can't follow yourself"
            ) {
                return res.status(400).json({ message: msg, error: msg });
            }
            if (msg === "You're already following this user") {
                return res.status(409).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async unFollowUser(req, res) {
        try {
            const followingId = req.params.id;
            const followerId = req.user?.id ?? req.user?._id;
            if (!followerId) return res.status(401).json({ message: "Unauthorized" });

            const result = await followService.unFollow(followerId, followingId);
            return res.status(200).json(result);
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (
                msg === "followerId and followingId are required" ||
                msg === "Invalid user id" ||
                msg === "You can't unfollow yourself"
            ) {
                return res.status(400).json({ message: msg, error: msg });
            }
            if (msg === "You're not following this user") {
                return res.status(404).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async getMyFollowings(req, res) {
        try {
            const viewerId = req.user?.id ?? req.user?._id;
            if (!viewerId) return res.status(401).json({ message: "Unauthorized" });
            const result = await followService.getMyFollowings(viewerId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (msg === "Invalid user id") {
                return res.status(400).json({ message: msg, error: msg });
            }
            if (msg === "Unauthorized") {
                return res.status(401).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async getUserFollowingsForViewer(req, res) {
        try {
            const targetUserId = req.params.id;
            const viewerUserId = req.user?.id ?? req.user?._id;
            if (!viewerUserId) return res.status(401).json({ message: "Unauthorized" });

            const result = await followService.getUserFollowingsForViewer({
                targetUserId,
                viewerUserId,
            });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (
                msg === "targetUserId and viewerUserId are required" ||
                msg === "Invalid user id"
            ) {
                return res.status(400).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async getFollowStats(req, res) {
        try {
            const targetUserId = req.params.id;
            const result = await followService.getFollowStats(targetUserId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (msg === "targetUserId is required" || msg === "Invalid user id") {
                return res.status(400).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async isFollowing(req, res) {
        try {
            const targetUserId = req.params.id;
            const viewerUserId = req.user?.id ?? req.user?._id;
            if (!viewerUserId) return res.status(401).json({ message: "Unauthorized" });

            const result = await followService.isFollowing({
                viewerUserId,
                targetUserId,
            });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (
                msg === "targetUserId and viewerUserId are required" ||
                msg === "Invalid user id"
            ) {
                return res.status(400).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async getMyFollowers(req, res) {
        try {
            const viewerId = req.user?.id ?? req.user?._id;
            if (!viewerId) return res.status(401).json({ message: "Unauthorized" });
            const result = await followService.getMyFollowers(viewerId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (msg === "Invalid user id") {
                return res.status(400).json({ message: msg, error: msg });
            }
            if (msg === "Unauthorized") {
                return res.status(401).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },

    async getUserFollowersForViewer(req, res) {
        try {
            const targetUserId = req.params.id;
            const viewerUserId = req.user?.id ?? req.user?._id;
            if (!viewerUserId) return res.status(401).json({ message: "Unauthorized" });

            const result = await followService.getUserFollowersForViewer({
                targetUserId,
                viewerUserId,
            });
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            const msg = error.message ?? "Internal server error";
            if (
                msg === "targetUserId and viewerUserId are required" ||
                msg === "Invalid user id"
            ) {
                return res.status(400).json({ message: msg, error: msg });
            }
            return res.status(500).json({ message: "Internal server error", error: msg });
        }
    },
}

export default FollowController;