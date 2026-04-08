import express from 'express'
import followController from '../controllers/followController.js';
import userController from '../controllers/userController.js'
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();


router.get("/me/following", requireAuth, followController.getMyFollowings)
router.get("/me/followers", requireAuth, followController.getMyFollowers)

router.get("/:id/follow-stats", followController.getFollowStats)
router.get("/:id/is-following", requireAuth, followController.isFollowing)
router.get("/:id/following", requireAuth, followController.getUserFollowingsForViewer)
router.get("/:id/followers", requireAuth, followController.getUserFollowersForViewer)

router.patch("/favourites/:bookId", requireAuth, userController.updateFavourites);

router.post("/:id/follow", requireAuth, followController.followUser)
router.delete("/:id/follow", requireAuth, followController.unFollowUser)

export default router;