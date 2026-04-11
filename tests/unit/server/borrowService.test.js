import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    jest,
  } from "@jest/globals";
  
  const mockBookRepo = {
    findByID: jest.fn(),
    increaseRequestCount: jest.fn(),
    resetRequestCount: jest.fn(),
    decreaseRequestCount: jest.fn(),
    setBookAvailability: jest.fn().mockResolvedValue({}),
  };
  
  const mockRequestRepo = {
    findRequestById: jest.fn(),
    findPendingByBookAndRequester: jest.fn(),
    createBorrow: jest.fn(),
    acceptExchange: jest.fn(),
    declineExchange: jest.fn(),
    markBorrowReturned: jest.fn(),
    cancelAllRequestsForBook: jest.fn().mockResolvedValue({}),
  };
  
  jest.unstable_mockModule("mongoose", () => {
    const actual = jest.requireActual("mongoose");
    const mockSession = {
      withTransaction: jest.fn(async (fn) => { await fn(); }),
      endSession: jest.fn(),
    };
    return {
      ...actual,
      default: {
        ...actual.default,
        startSession: jest.fn().mockResolvedValue(mockSession),
        Types: actual.default.Types,
      },
    };
  });
  
  jest.unstable_mockModule("../../../server/src/repositories/bookRepository.js", () => ({
    default: mockBookRepo,
  }));
  
  jest.unstable_mockModule("../../../server/src/repositories/requestRepository.js", () => ({
    default: mockRequestRepo,
  }));
  
  let borrowService;
  
  beforeAll(async () => {
    const mod = await import("../../../server/src/services/borrowService.js");
    borrowService = mod.default;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const OWNER_ID = { equals: (v) => String(v) === "owner111" };
  const REQUESTER_ID = "requester222";
  const BOOK_ID = "book333";
  const REQUEST_ID = "req444";
  const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const PAST_DATE = new Date(Date.now() - 1000).toISOString();
  
  function makeOwnerRef() {
    // Mongoose ObjectId has .equals() on the object itself
    // The service does: bookOwner._id ?? bookOwner — so if bookOwner has no _id,
    // it IS the id and needs equals() directly on it
    const ref = { equals: (v) => String(v) === "owner111", toString: () => "owner111" };
    return ref;
  }
  
  function makeBook(overrides = {}) {
    return {
      _id: BOOK_ID,
      bookOwner: makeOwnerRef(),
      isAvailable: true,
      ...overrides,
    };
  }
  
  function makeRequest(overrides = {}) {
    return {
      _id: REQUEST_ID,
      bookId: BOOK_ID,
      bookOwner: makeOwnerRef(),
      requesterId: { _id: REQUESTER_ID, equals: (v) => String(v) === REQUESTER_ID },
      type: "Borrow",
      status: "Pending",
      returnBy: new Date(FUTURE_DATE),
      ...overrides,
    };
  }
  
  describe("borrowService.initiateBorrow", () => {
    it("throws if returnBy is missing", async () => {
      await expect(
        borrowService.initiateBorrow({ requesterId: REQUESTER_ID, ownerId: "owner111", bookId: BOOK_ID, returnBy: null })
      ).rejects.toThrow("A return date is required.");
    });
  
    it("throws if returnBy is in the past", async () => {
      await expect(
        borrowService.initiateBorrow({ requesterId: REQUESTER_ID, ownerId: "owner111", bookId: BOOK_ID, returnBy: PAST_DATE })
      ).rejects.toThrow("Return date must be in the future.");
    });
  
    it("throws if book does not exist", async () => {
      mockBookRepo.findByID.mockResolvedValue(null);
      await expect(
        borrowService.initiateBorrow({ requesterId: REQUESTER_ID, ownerId: "owner111", bookId: BOOK_ID, returnBy: FUTURE_DATE })
      ).rejects.toThrow("The requested book was not found.");
    });
  
    it("throws if book is not available", async () => {
      mockBookRepo.findByID.mockResolvedValue(makeBook({ isAvailable: false }));
      await expect(
        borrowService.initiateBorrow({ requesterId: REQUESTER_ID, ownerId: "owner111", bookId: BOOK_ID, returnBy: FUTURE_DATE })
      ).rejects.toThrow("The requested book is currently not available.");
    });
  
    it("throws if requester is the owner", async () => {
      mockBookRepo.findByID.mockResolvedValue(makeBook());
      await expect(
        borrowService.initiateBorrow({ requesterId: "owner111", ownerId: "owner111", bookId: BOOK_ID, returnBy: FUTURE_DATE })
      ).rejects.toThrow("You cannot borrow your own book.");
    });
  
    it("throws if duplicate pending request exists", async () => {
      mockBookRepo.findByID.mockResolvedValue(makeBook());
      mockRequestRepo.findPendingByBookAndRequester.mockResolvedValue({ _id: "existing" });
      mockRequestRepo.createBorrow.mockResolvedValue([{ _id: REQUEST_ID }]);
      mockBookRepo.increaseRequestCount.mockResolvedValue({});
      await expect(
        borrowService.initiateBorrow({ requesterId: REQUESTER_ID, ownerId: "owner111", bookId: BOOK_ID, returnBy: FUTURE_DATE })
      ).rejects.toThrow("You've already requested to borrow this book.");
    });
  });
  
  describe("borrowService.acceptBorrow", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        borrowService.acceptBorrow({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("The borrow request doesn't exist.");
    });
  
    it("throws if request is not a borrow", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ type: "Exchange" }));
      await expect(
        borrowService.acceptBorrow({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("The request isn't a borrow request.");
    });
  
    it("throws if request is not pending", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Accepted" }));
      await expect(
        borrowService.acceptBorrow({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("Only pending borrow requests can be accepted.");
    });
  
    it("throws if user is not the book owner", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      await expect(
        borrowService.acceptBorrow({ requestId: REQUEST_ID, userId: REQUESTER_ID })
      ).rejects.toThrow("Only the book owner can accept this request.");
    });
  
    it("returns success when owner accepts", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      mockRequestRepo.acceptExchange.mockResolvedValue({ ...makeRequest(), status: "Accepted" });
      mockBookRepo.resetRequestCount.mockResolvedValue({});
      const result = await borrowService.acceptBorrow({ requestId: REQUEST_ID, userId: "owner111" });
      expect(result.success).toBe(true);
      expect(result.message).toBe("Borrow request accepted.");
    });
  });
  
  describe("borrowService.declineBorrow", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        borrowService.declineBorrow({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("The borrow request doesn't exist.");
    });
  
    it("throws if user is not the book owner", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      await expect(
        borrowService.declineBorrow({ requestId: REQUEST_ID, userId: REQUESTER_ID })
      ).rejects.toThrow("Only the book owner can decline this request.");
    });
  
    it("returns success when owner declines", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      mockRequestRepo.declineExchange.mockResolvedValue({ ...makeRequest(), status: "Declined" });
      mockBookRepo.decreaseRequestCount.mockResolvedValue({});
      const result = await borrowService.declineBorrow({ requestId: REQUEST_ID, userId: "owner111" });
      expect(result.success).toBe(true);
      expect(result.message).toBe("Borrow request declined.");
    });
  });
  
  describe("borrowService.markBorrowReturned", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        borrowService.markBorrowReturned({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("The borrow request doesn't exist.");
    });
  
    it("throws if request is not a borrow", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ type: "Exchange" }));
      await expect(
        borrowService.markBorrowReturned({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("The request isn't a borrow request.");
    });
  
    it("throws if request is not accepted", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Pending" }));
      await expect(
        borrowService.markBorrowReturned({ requestId: REQUEST_ID, userId: "owner111" })
      ).rejects.toThrow("Only an active borrow can be marked as returned.");
    });
  
    it("throws if user is not the book owner", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Accepted" }));
      await expect(
        borrowService.markBorrowReturned({ requestId: REQUEST_ID, userId: REQUESTER_ID })
      ).rejects.toThrow("Only the book owner can mark this borrow as returned.");
    });
  
    it("returns success when owner marks as returned", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Accepted" }));
      mockRequestRepo.markBorrowReturned.mockResolvedValue({ ...makeRequest(), status: "Returned" });
      const result = await borrowService.markBorrowReturned({ requestId: REQUEST_ID, userId: "owner111" });
      expect(result.success).toBe(true);
      expect(result.message).toBe("Borrow marked as returned.");
    });
  });