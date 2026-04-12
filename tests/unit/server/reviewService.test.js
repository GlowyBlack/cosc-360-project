import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockReviewRepository = {
  findByRevieweeId: jest.fn(),
  findByRequestId: jest.fn(),
  findByRequestAndReviewer: jest.fn(),
  create: jest.fn(),
};

const mockRequestRepository = {
  findRequestById: jest.fn(),
};

const mockUserRepository = {
  incrementReviewStats: jest.fn(),
};

jest.unstable_mockModule("../../../server/src/repositories/reviewRepository.js", () => ({
  default: mockReviewRepository,
}));
jest.unstable_mockModule("../../../server/src/repositories/requestRepository.js", () => ({
  default: mockRequestRepository,
}));
jest.unstable_mockModule("../../../server/src/repositories/userRepository.js", () => ({
  default: mockUserRepository,
}));

let reviewService;

beforeAll(async () => {
  const mod = await import("../../../server/src/services/reviewService.js");
  reviewService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("reviewService", () => {
  it("getEligibility reports not-participant and already-reviewed states", async () => {
    mockRequestRepository.findRequestById
      .mockResolvedValueOnce({
        _id: "req-1",
        type: "borrow",
        status: "Returned",
        bookOwner: "owner-1",
        requesterId: "requester-1",
      })
      .mockResolvedValueOnce({
        _id: "req-1",
        type: "borrow",
        status: "Returned",
        bookOwner: "owner-1",
        requesterId: "requester-1",
      });
    mockReviewRepository.findByRequestAndReviewer.mockResolvedValue({ _id: "review-1" });

    await expect(reviewService.getEligibility("req-1", "outsider")).resolves.toEqual({
      eligible: false,
      reason: "not_participant",
    });

    await expect(reviewService.getEligibility("req-1", "owner-1")).resolves.toEqual({
      eligible: false,
      reason: "already_reviewed",
      review: { _id: "review-1" },
    });
  });

  it("getEligibility returns a reviewee for eligible requests", async () => {
    mockRequestRepository.findRequestById.mockResolvedValue({
      _id: "req-1",
      type: "exchange",
      status: "Accepted",
      bookOwner: "owner-1",
      requesterId: "requester-1",
    });
    mockReviewRepository.findByRequestAndReviewer.mockResolvedValue(null);

    await expect(reviewService.getEligibility("req-1", "owner-1")).resolves.toEqual({
      eligible: true,
      revieweeId: "requester-1",
      requestStatus: "Accepted",
    });
  });

  it("createReview validates request state and rating bounds", async () => {
    mockRequestRepository.findRequestById.mockResolvedValue({
      _id: "req-1",
      type: "borrow",
      status: "Pending",
      bookOwner: "owner-1",
      requesterId: "requester-1",
    });

    await expect(
      reviewService.createReview({
        requestId: "req-1",
        reviewerId: "owner-1",
        rating: 5,
        comment: "Nice",
      }),
    ).rejects.toMatchObject({ status: 400 });

    mockRequestRepository.findRequestById.mockResolvedValue({
      _id: "req-1",
      type: "borrow",
      status: "Returned",
      bookOwner: "owner-1",
      requesterId: "requester-1",
    });
    mockReviewRepository.findByRequestAndReviewer.mockResolvedValue(null);

    await expect(
      reviewService.createReview({
        requestId: "req-1",
        reviewerId: "owner-1",
        rating: 7,
        comment: "",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("createReview creates the review and updates review stats", async () => {
    mockRequestRepository.findRequestById.mockResolvedValue({
      _id: "req-1",
      type: "borrow",
      status: "Returned",
      bookOwner: "owner-1",
      requesterId: "requester-1",
    });
    mockReviewRepository.findByRequestAndReviewer.mockResolvedValue(null);
    mockReviewRepository.create.mockResolvedValue({ _id: "review-1", rating: 4 });

    const out = await reviewService.createReview({
      requestId: "req-1",
      reviewerId: "owner-1",
      rating: 4,
      comment: "  Smooth trade  ",
    });

    expect(mockReviewRepository.create).toHaveBeenCalledWith({
      requestId: "req-1",
      reviewerId: "owner-1",
      revieweeId: "requester-1",
      rating: 4,
      comment: "Smooth trade",
    });
    expect(mockUserRepository.incrementReviewStats).toHaveBeenCalledWith("requester-1", 4);
    expect(out).toEqual({ _id: "review-1", rating: 4 });
  });
});
