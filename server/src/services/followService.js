import mongoose from "mongoose";
import followRepository from "../repositories/followingRepository.js";
import { httpError } from "../utils/httpError.js";

const FollowService = {
    async follow(followerId, followingId) {
        if (!followerId || !followingId) {
            throw httpError(400, "followerId and followingId are required");
        }
        if (!mongoose.isValidObjectId(followerId) || !mongoose.isValidObjectId(followingId)) {
            throw httpError(400, "Invalid user id");
        }
        if (String(followerId) === String(followingId)) {
            throw httpError(400, "You can't follow yourself");
        }

        try {
            const following = await followRepository.createFollow({ followerId, followingId });
            return {
                success: true,
                message: "Followed user.",
                follow: following,
            };
        } catch (error) {
            if (error?.code === 11000) {
                throw httpError(409, "You're already following this user");
            }
            throw error;
        }
    },

    async unFollow(followerId, followingId) {
        if (!followerId || !followingId) {
            throw httpError(400, "followerId and followingId are required");
        }
        if (!mongoose.isValidObjectId(followerId) || !mongoose.isValidObjectId(followingId)) {
            throw httpError(400, "Invalid user id");
        }
        if (String(followerId) === String(followingId)) {
            throw httpError(400, "You can't unfollow yourself");
        }

        const removedFollow = await followRepository.removeFollow({ followerId, followingId });
        if (!removedFollow) throw httpError(404, "You're not following this user");
        return {
            success: true,
            message: "Unfollowed user.",
            follow: removedFollow,
        };
    },

    async getMyFollowings(userId) {
        if (!userId) throw httpError(401, "Unauthorized");
        if (!mongoose.isValidObjectId(userId)) throw httpError(400, "Invalid user id");

        const rows = await followRepository.findFollowingsByUser({ userId });
        return rows.map((row) => ({
            id: String(row.followingId?._id ?? row.followingId ?? ""),
            username: row.followingId?.username ?? "",
            location: row.followingId?.location ?? null,
            profileImage: row.followingId?.profileImage ?? null,
            bio: row.followingId?.bio ?? null,
            isFollowedByViewer: true,
            isSelf: String(row.followingId?._id ?? row.followingId ?? "") === String(userId),
            followedAt: row.createdAt,
        }));
    },

    async getUserFollowingsForViewer({ targetUserId, viewerUserId }) {
        if (!targetUserId || !viewerUserId) {
            throw httpError(400, "targetUserId and viewerUserId are required");
        }
        if (!mongoose.isValidObjectId(targetUserId) || !mongoose.isValidObjectId(viewerUserId)) {
            throw httpError(400, "Invalid user id");
        }

        const rows = await followRepository.findFollowingsByUser({ userId: targetUserId });
        const followingIds = rows
            .map((row) => row.followingId?._id ?? row.followingId)
            .filter(Boolean);

        const viewerFollowRows = followingIds.length
            ? await followRepository.findFollowingsByUsers({
                followerId: viewerUserId,
                followingIds,
            })
            : [];

        const viewerFollowingSet = new Set(
            viewerFollowRows.map((row) => String(row.followingId?._id ?? row.followingId)),
        );

        return rows.map((row) => {
            const fid = String(row.followingId?._id ?? row.followingId ?? "");
            return {
                id: fid,
                username: row.followingId?.username ?? "",
                location: row.followingId?.location ?? null,
                profileImage: row.followingId?.profileImage ?? null,
                bio: row.followingId?.bio ?? null,
                isFollowedByViewer: viewerFollowingSet.has(fid),
                isSelf: fid === String(viewerUserId),
                followedAt: row.createdAt,
            };
        });
    },

    async getFollowStats(targetUserId) {
        if (!targetUserId) throw httpError(400, "targetUserId is required");
        if (!mongoose.isValidObjectId(targetUserId)) throw httpError(400, "Invalid user id");

        const [followersCount, followingsCount] = await Promise.all([
            followRepository.countFollowersByUser({ userId: targetUserId }),
            followRepository.countFollowingsByUser({ userId: targetUserId }),
        ]);

        return {
            userId: String(targetUserId),
            followersCount,
            followingCount: followingsCount,
        };
    },

    async isFollowing({ viewerUserId, targetUserId }) {
        if (!viewerUserId || !targetUserId) {
            throw httpError(400, "targetUserId and viewerUserId are required");
        }
        if (!mongoose.isValidObjectId(targetUserId) || !mongoose.isValidObjectId(viewerUserId)) {
            throw httpError(400, "Invalid user id");
        }

        const relation = await followRepository.findFollow({
            followerId: viewerUserId,
            followingId: targetUserId,
        });
        return {
            viewerUserId: String(viewerUserId),
            targetUserId: String(targetUserId),
            isFollowing: Boolean(relation),
        };
    },

    async getMyFollowers(userId) {
        if (!userId) throw httpError(401, "Unauthorized");
        if (!mongoose.isValidObjectId(userId)) throw httpError(400, "Invalid user id");

        const rows = await followRepository.findFollowersByUser({ userId });
        return rows.map((row) => ({
            id: String(row.followerId?._id ?? row.followerId ?? ""),
            username: row.followerId?.username ?? "",
            location: row.followerId?.location ?? null,
            profileImage: row.followerId?.profileImage ?? null,
            bio: row.followerId?.bio ?? null,
            isFollowedByViewer: String(row.followerId?._id ?? row.followerId ?? "") === String(userId),
            isSelf: String(row.followerId?._id ?? row.followerId ?? "") === String(userId),
            followedAt: row.createdAt,
        }));
    },

    async getUserFollowersForViewer({ targetUserId, viewerUserId }) {
        if (!targetUserId || !viewerUserId) {
            throw httpError(400, "targetUserId and viewerUserId are required");
        }
        if (!mongoose.isValidObjectId(targetUserId) || !mongoose.isValidObjectId(viewerUserId)) {
            throw httpError(400, "Invalid user id");
        }

        const rows = await followRepository.findFollowersByUser({ userId: targetUserId });
        const followerIds = rows
            .map((row) => row.followerId?._id ?? row.followerId)
            .filter(Boolean);

        const viewerFollowRows = followerIds.length
            ? await followRepository.findFollowingsByUsers({
                followerId: viewerUserId,
                followingIds: followerIds,
            })
            : [];

        const viewerFollowingSet = new Set(
            viewerFollowRows.map((row) => String(row.followingId?._id ?? row.followingId)),
        );

        return rows.map((row) => {
            const fid = String(row.followerId?._id ?? row.followerId ?? "");
            return {
                id: fid,
                username: row.followerId?.username ?? "",
                location: row.followerId?.location ?? null,
                profileImage: row.followerId?.profileImage ?? null,
                bio: row.followerId?.bio ?? null,
                isFollowedByViewer: viewerFollowingSet.has(fid),
                isSelf: fid === String(viewerUserId),
                followedAt: row.createdAt,
            };
        });
    },
};

export default FollowService;
