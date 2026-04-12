import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockFollowRepository = {
  createFollow: jest.fn(),
  removeFollow: jest.fn(),
  findFollowingsByUser: jest.fn(),
  findFollowingsByUsers: jest.fn(),
  countFollowersByUser: jest.fn(),
  countFollowingsByUser: jest.fn(),
  findFollow: jest.fn(),
  findFollowersByUser: jest.fn(),
};

jest.unstable_mockModule("../../../server/src/repositories/followingRepository.js", () => ({
  default: mockFollowRepository,
}));

let followService;

const a = "507f1f77bcf86cd799439011";
const b = "507f1f77bcf86cd799439012";
const c = "507f1f77bcf86cd799439013";

beforeAll(async () => {
  const mod = await import("../../../server/src/services/followService.js");
  followService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("followService", () => {
  it("follow validates self-follow and duplicate follows", async () => {
    await expect(followService.follow(a, a)).rejects.toThrow("You can't follow yourself");

    mockFollowRepository.createFollow.mockRejectedValue({ code: 11000 });
    await expect(followService.follow(a, b)).rejects.toThrow(
      "You're already following this user",
    );
  });

  it("unFollow rejects missing relationships", async () => {
    mockFollowRepository.removeFollow.mockResolvedValue(null);
    await expect(followService.unFollow(a, b)).rejects.toThrow(
      "You're not following this user",
    );
  });

  it("getMyFollowings maps repository rows for the viewer", async () => {
    mockFollowRepository.findFollowingsByUser.mockResolvedValue([
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        followingId: {
          _id: b,
          username: "Reader B",
          location: "Kelowna, BC",
          profileImage: "https://example.com/b.png",
          bio: "Bio B",
        },
      },
    ]);

    await expect(followService.getMyFollowings(a)).resolves.toEqual([
      expect.objectContaining({
        id: b,
        username: "Reader B",
        isFollowedByViewer: true,
        isSelf: false,
      }),
    ]);
  });

  it("getFollowStats and isFollowing return summary data", async () => {
    mockFollowRepository.countFollowersByUser.mockResolvedValue(7);
    mockFollowRepository.countFollowingsByUser.mockResolvedValue(3);
    mockFollowRepository.findFollow.mockResolvedValue({ _id: "rel-1" });

    await expect(followService.getFollowStats(b)).resolves.toEqual({
      userId: b,
      followersCount: 7,
      followingCount: 3,
    });

    await expect(
      followService.isFollowing({ viewerUserId: a, targetUserId: b }),
    ).resolves.toEqual({
      viewerUserId: a,
      targetUserId: b,
      isFollowing: true,
    });
  });

  it("getUserFollowersForViewer marks whether the viewer follows each follower", async () => {
    mockFollowRepository.findFollowersByUser.mockResolvedValue([
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        followerId: {
          _id: b,
          username: "Reader B",
        },
      },
      {
        createdAt: "2026-01-01T00:00:00.000Z",
        followerId: {
          _id: c,
          username: "Reader C",
        },
      },
    ]);
    mockFollowRepository.findFollowingsByUsers.mockResolvedValue([
      { followingId: { _id: b } },
    ]);

    const out = await followService.getUserFollowersForViewer({
      targetUserId: c,
      viewerUserId: a,
    });

    expect(out).toEqual([
      expect.objectContaining({ id: b, isFollowedByViewer: true }),
      expect.objectContaining({ id: c, isFollowedByViewer: false }),
    ]);
  });
});
