import followService from "../services/followService.js";
import { sendServiceError } from "../utils/httpError.js";

const FollowController = {
    async followUser(req, res) {
        try {
            const followingId = req.params.id;
            const followerId = req.user?.id ?? req.user?._id;
            if (!followerId) return res.status(401).json({ message: "Unauthorized" });

            const result = await followService.follow(followerId, followingId);
            return res.status(201).json(result);
        } catch (error) {
            return sendServiceError(res, error);
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
            return sendServiceError(res, error);
        }
    },

    async getMyFollowings(req, res) {
        try {
            const viewerId = req.user?.id ?? req.user?._id;
            if (!viewerId) return res.status(401).json({ message: "Unauthorized" });
            const result = await followService.getMyFollowings(viewerId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
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
            return sendServiceError(res, error);
        }
    },

    async getFollowStats(req, res) {
        try {
            const targetUserId = req.params.id;
            const result = await followService.getFollowStats(targetUserId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
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
            return sendServiceError(res, error);
        }
    },

    async getMyFollowers(req, res) {
        try {
            const viewerId = req.user?.id ?? req.user?._id;
            if (!viewerId) return res.status(401).json({ message: "Unauthorized" });
            const result = await followService.getMyFollowers(viewerId);
            return res.status(200).json({ success: true, data: result });
        } catch (error) {
            return sendServiceError(res, error);
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
            return sendServiceError(res, error);
        }
    },
};

export default FollowController;
