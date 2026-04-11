import {
    describe,
    it,
    expect,
    beforeAll,
    beforeEach,
    jest,
  } from "@jest/globals";
  
  const mockMessageRepo = {
    findByRequestId: jest.fn(),
    create: jest.fn(),
    findByIdWithSender: jest.fn(),
    markIncomingAsRead: jest.fn(),
    findLastMessageAndUnreadCountPerRequest: jest.fn(),
  };
  
  const mockRequestRepo = {
    findRequestById: jest.fn(),
    findUserRequests: jest.fn(),
  };
  
  jest.unstable_mockModule("../../../server/src/repositories/messageRepository.js", () => ({
    default: mockMessageRepo,
  }));
  
  jest.unstable_mockModule("../../../server/src/repositories/requestRepository.js", () => ({
    default: mockRequestRepo,
  }));
  
  let messageService;
  
  beforeAll(async () => {
    const mod = await import("../../../server/src/services/messageService.js");
    messageService = mod.default;
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const OWNER_ID = "507f1f77bcf86cd799439011";
  const REQUESTER_ID = "507f1f77bcf86cd799439012";
  const REQUEST_ID = "507f1f77bcf86cd799439013";
  
  function makeRequest(overrides = {}) {
    return {
      _id: REQUEST_ID,
      bookOwner: OWNER_ID,
      requesterId: REQUESTER_ID,
      status: "Pending",
      type: "Borrow",
      ...overrides,
    };
  }
  
  describe("messageService.send", () => {
    it("throws if content is empty", async () => {
      await expect(
        messageService.send({ requestId: REQUEST_ID, senderId: OWNER_ID, content: "" })
      ).rejects.toThrow("Message content cannot be empty");
    });
  
    it("throws if content is only whitespace", async () => {
      await expect(
        messageService.send({ requestId: REQUEST_ID, senderId: OWNER_ID, content: "   " })
      ).rejects.toThrow("Message content cannot be empty");
    });
  
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        messageService.send({ requestId: REQUEST_ID, senderId: OWNER_ID, content: "Hello" })
      ).rejects.toThrow("Request not found");
    });
  
    it("throws if sender is not a participant", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      const outsider = "507f1f77bcf86cd799439099";
      await expect(
        messageService.send({ requestId: REQUEST_ID, senderId: outsider, content: "Hello" })
      ).rejects.toThrow("Not allowed to access this thread");
    });
  
    it("saves and returns message when sender is the owner", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      const created = { _id: "msg1" };
      const withSender = { _id: "msg1", content: "Hello", senderId: { username: "Alice" } };
      mockMessageRepo.create.mockResolvedValue(created);
      mockMessageRepo.findByIdWithSender.mockResolvedValue(withSender);
  
      const result = await messageService.send({
        requestId: REQUEST_ID,
        senderId: OWNER_ID,
        content: "Hello",
      });
  
      expect(mockMessageRepo.create).toHaveBeenCalledWith({
        requestId: REQUEST_ID,
        senderId: OWNER_ID,
        content: "Hello",
      });
      expect(result).toEqual(withSender);
    });
  
    it("saves and returns message when sender is the requester", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      const created = { _id: "msg2" };
      const withSender = { _id: "msg2", content: "Hi back", senderId: { username: "Bob" } };
      mockMessageRepo.create.mockResolvedValue(created);
      mockMessageRepo.findByIdWithSender.mockResolvedValue(withSender);
  
      const result = await messageService.send({
        requestId: REQUEST_ID,
        senderId: REQUESTER_ID,
        content: "Hi back",
      });
  
      expect(result).toEqual(withSender);
    });
  });
  
  describe("messageService.getThread", () => {
    it("throws if request does not exist", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(null);
      await expect(
        messageService.getThread(REQUEST_ID, OWNER_ID)
      ).rejects.toThrow("Request not found");
    });
  
    it("throws if user is not a participant", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      const outsider = "507f1f77bcf86cd799439099";
      await expect(
        messageService.getThread(REQUEST_ID, outsider)
      ).rejects.toThrow("Not allowed to access this thread");
    });
  
    it("returns messages for a valid participant", async () => {
      mockRequestRepo.findRequestById.mockResolvedValue(makeRequest());
      const messages = [{ _id: "m1", content: "Hey" }];
      mockMessageRepo.findByRequestId.mockResolvedValue(messages);
  
      const result = await messageService.getThread(REQUEST_ID, OWNER_ID);
      expect(result).toEqual(messages);
      expect(mockMessageRepo.findByRequestId).toHaveBeenCalledWith(REQUEST_ID);
    });
  });
  
  describe("messageService.getInbox", () => {
    it("throws if userId is missing", async () => {
      await expect(messageService.getInbox(null)).rejects.toThrow("User ID is required");
    });
  
    it("returns threads sorted by most recent message", async () => {
      const req1 = { _id: "r1", updatedAt: new Date("2024-01-01"), createdAt: new Date("2024-01-01"), bookOwner: OWNER_ID, requesterId: REQUESTER_ID };
      const req2 = { _id: "r2", updatedAt: new Date("2024-01-02"), createdAt: new Date("2024-01-02"), bookOwner: OWNER_ID, requesterId: REQUESTER_ID };
      mockRequestRepo.findUserRequests.mockResolvedValue([req1, req2]);
      mockMessageRepo.findLastMessageAndUnreadCountPerRequest.mockResolvedValue([
        { _id: "r1", lastContent: "Old message", lastCreatedAt: new Date("2024-01-01"), unreadCount: 0 },
        { _id: "r2", lastContent: "New message", lastCreatedAt: new Date("2024-01-05"), unreadCount: 2 },
      ]);
  
      const result = await messageService.getInbox(OWNER_ID);
      expect(result.threads).toHaveLength(2);
      expect(result.threads[0].requestId).toBe("r2");
      expect(result.threads[0].unreadCount).toBe(2);
      expect(result.threads[1].requestId).toBe("r1");
    });
  });