import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    jest,
  } from "@jest/globals";
  
  const OWNER_ID = "owner111";
  const REQUESTER_ID = "req222";
  const BOOK_ID = "book333";
  const OFFERED_BOOK_ID = "book444";
  const REQUEST_ID = "req555";
  
  function mongoId(str) {
    return { _id: str, equals: (v) => String(v) === str, toString: () => str };
  }
  
  const mockBookRepo = {
    findByID: jest.fn(),
    increaseRequestCount: jest.fn(),
    decreaseRequestCount: jest.fn(),
    updateBookOwner: jest.fn(),
    toggleAvailability: jest.fn(),
    cancelAllRequestsForBook: jest.fn(),
  };
  
  const mockRequestRepo = {
    findRequestById: jest.fn(),
    findPendingByBookAndRequester: jest.fn(),
    createExchange: jest.fn(),
    acceptExchange: jest.fn(),
    declineExchange: jest.fn(),
    cancelRequest: jest.fn(),
    cancelAllRequestsForBook: jest.fn(),
    switchOfferedBook: jest.fn(),
  };
  
  jest.unstable_mockModule("../../../server/src/repositories/bookRepository.js", () => ({
    default: mockBookRepo,
  }));
  
  jest.unstable_mockModule("../../../server/src/repositories/requestRepository.js", () => ({
    default: mockRequestRepo,
  }));
  
  let exchangeService;
  
  beforeAll(async () => {
    const mod = await import("../../../server/src/services/exchangeService.js");
    exchangeService = mod.default;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  function makeBook(id, ownerId, overrides = {}) {
    // The service does: bookOwner?._id ?? bookOwner — so if bookOwner has no _id,
    // equals() must be on the object itself
    const owner = { equals: (v) => String(v) === ownerId, toString: () => ownerId };
    return {
      _id: id,
      bookOwner: owner,
      isAvailable: true,
      ...overrides,
    };
  }
  
  function makeRequest(overrides = {}) {
    return {
      _id: REQUEST_ID,
      bookId: BOOK_ID,
      offeredBookId: OFFERED_BOOK_ID,
      bookOwner: { _id: OWNER_ID, equals: (v) => String(v) === OWNER_ID },
      requesterId: { _id: REQUESTER_ID, equals: (v) => String(v) === REQUESTER_ID },
      type: "Exchange",
      status: "Pending",
      ...overrides,
    };
  }
  
  describe("exchangeService.initiateExchange", () => {
    it("throws if target book does not exist", async () => {
      mockBookRepo.findByID.mockResolvedValueOnce(null);
      await expect(
        exchangeService.initiateExchange({
          requesterId: mongoId(REQUESTER_ID),
          ownerId: mongoId(OWNER_ID),
          bookId: BOOK_ID,
          offeredBookId: OFFERED_BOOK_ID,
        })
      ).rejects.toThrow("The requested book was not found.");
    });
  
    it("throws if target book is not available", async () => {
      mockBookRepo.findByID
        .mockResolvedValueOnce(makeBook(BOOK_ID, OWNER_ID, { isAvailable: false }))
        .mockResolvedValueOnce(makeBook(OFFERED_BOOK_ID, REQUESTER_ID));
      await expect(
        exchangeService.initiateExchange({
          requesterId: mongoId(REQUESTER_ID),
          ownerId: mongoId(OWNER_ID),
          bookId: BOOK_ID,
          offeredBookId: OFFERED_BOOK_ID,
        })
      ).rejects.toThrow("The requested book is currently not available.");
    });
  
    it("throws if offered book does not belong to requester", async () => {
      mockBookRepo.findByID
        .mockResolvedValueOnce(makeBook(BOOK_ID, OWNER_ID))
        .mockResolvedValueOnce(makeBook(OFFERED_BOOK_ID, OWNER_ID));
      await expect(
        exchangeService.initiateExchange({
          requesterId: mongoId(REQUESTER_ID),
          ownerId: mongoId(OWNER_ID),
          bookId: BOOK_ID,
          offeredBookId: OFFERED_BOOK_ID,
        })
      ).rejects.toThrow("The book you are offering does not belong to you.");
    });
  
    it("throws if requester and owner are the same person", async () => {
      mockBookRepo.findByID
        .mockResolvedValueOnce(makeBook(BOOK_ID, OWNER_ID))
        .mockResolvedValueOnce(makeBook(OFFERED_BOOK_ID, OWNER_ID));
      await expect(
        exchangeService.initiateExchange({
          requesterId: mongoId(OWNER_ID),
          ownerId: mongoId(OWNER_ID),
          bookId: BOOK_ID,
          offeredBookId: OFFERED_BOOK_ID,
        })
      ).rejects.toThrow("You cannot exchange a book with yourself.");
    });
  });
  
  describe("exchangeService.acceptExchange", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        exchangeService.acceptExchange({ requestId: REQUEST_ID, userId: mongoId(OWNER_ID) })
      ).rejects.toThrow("The exchange request doesn't exist.");
    });
  
    it("throws if request is not pending", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Accepted" }));
      await expect(
        exchangeService.acceptExchange({ requestId: REQUEST_ID, userId: mongoId(OWNER_ID) })
      ).rejects.toThrow("The exchange request isn't a pending request.");
    });
  
    it("throws if user is not the book owner", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      await expect(
        exchangeService.acceptExchange({ requestId: REQUEST_ID, userId: mongoId(REQUESTER_ID) })
      ).rejects.toThrow("Unauthorized Access");
    });
  });
  
  describe("exchangeService.declineExchange", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        exchangeService.declineExchange({ requestId: REQUEST_ID, userId: mongoId(OWNER_ID) })
      ).rejects.toThrow("The exchange request doesn't exist.");
    });
  
    it("throws if user is not the book owner", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      await expect(
        exchangeService.declineExchange({ requestId: REQUEST_ID, userId: mongoId(REQUESTER_ID) })
      ).rejects.toThrow("Unauthorized Access");
    });
  
    it("throws if request is not pending", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Declined" }));
      await expect(
        exchangeService.declineExchange({ requestId: REQUEST_ID, userId: mongoId(OWNER_ID) })
      ).rejects.toThrow("The exchange request isn't a pending request.");
    });
  });
  
  describe("exchangeService.cancelExchange", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        exchangeService.cancelExchange({ requestId: REQUEST_ID, userId: mongoId(REQUESTER_ID) })
      ).rejects.toThrow("The exchange request doesn't exist.");
    });
  
    it("throws if user is not the requester", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      await expect(
        exchangeService.cancelExchange({ requestId: REQUEST_ID, userId: mongoId(OWNER_ID) })
      ).rejects.toThrow("Only the person who proposed the exchange can cancel it.");
    });
  
    it("throws if request is not pending", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest({ status: "Accepted" }));
      await expect(
        exchangeService.cancelExchange({ requestId: REQUEST_ID, userId: mongoId(REQUESTER_ID) })
      ).rejects.toThrow("The exchange request isn't a pending request.");
    });
  });