import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";

const mockReportRepository = {
  findOpenByReporterAndTarget: jest.fn(),
  createReport: jest.fn(),
  findById: jest.fn(),
  findAllByReporter: jest.fn(),
  findAll: jest.fn(),
  updateStatusById: jest.fn(),
};

const mockBookRepository = { findByID: jest.fn() };
const mockUserRepository = { findById: jest.fn() };
const mockPostRepository = { findById: jest.fn() };
const mockCommentRepository = { findById: jest.fn() };

jest.unstable_mockModule("../../../server/src/repositories/reportRepository.js", () => ({
  default: mockReportRepository,
}));
jest.unstable_mockModule("../../../server/src/repositories/bookRepository.js", () => ({
  default: mockBookRepository,
}));
jest.unstable_mockModule("../../../server/src/repositories/userRepository.js", () => ({
  default: mockUserRepository,
}));
jest.unstable_mockModule("../../../server/src/repositories/postRepository.js", () => ({
  default: mockPostRepository,
}));
jest.unstable_mockModule("../../../server/src/repositories/commentRepository.js", () => ({
  default: mockCommentRepository,
}));

let reportService;

const reporter = "507f1f77bcf86cd799439011";
const target = "507f1f77bcf86cd799439012";

beforeAll(async () => {
  const mod = await import("../../../server/src/services/reportService.js");
  reportService = mod.default;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("reportService", () => {
  it("createReport validates target existence and trims long reasons", async () => {
    mockPostRepository.findById.mockResolvedValue({ _id: target });
    mockReportRepository.findOpenByReporterAndTarget.mockResolvedValue(null);
    mockReportRepository.createReport.mockResolvedValue({ _id: "report-1" });
    mockReportRepository.findById.mockResolvedValue({ _id: "report-1", status: "Open" });

    await reportService.createReport(reporter, {
      targetType: "Post",
      targetId: target,
      reason: "x".repeat(2100),
    });

    expect(mockReportRepository.createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: reporter,
        targetType: "Post",
        targetId: target,
        status: "Open",
        reason: "x".repeat(2000),
      }),
    );
  });

  it("createReport rejects duplicates and invalid target types", async () => {
    await expect(
      reportService.createReport(reporter, {
        targetType: "Message",
        targetId: target,
        reason: "",
      }),
    ).rejects.toThrow("Invalid target type");

    mockPostRepository.findById.mockResolvedValue({ _id: target });
    mockReportRepository.findOpenByReporterAndTarget.mockResolvedValue({ _id: "dup" });

    await expect(
      reportService.createReport(reporter, {
        targetType: "Post",
        targetId: target,
        reason: "duplicate",
      }),
    ).rejects.toThrow("You already have an open report for this item");
  });

  it("listMyReports and listReportsForAdmin return totals", async () => {
    mockReportRepository.findAllByReporter.mockResolvedValue([{ _id: "r1" }, { _id: "r2" }]);
    mockReportRepository.findAll.mockResolvedValue([{ _id: "r1" }]);

    await expect(reportService.listMyReports(reporter)).resolves.toEqual({
      items: [{ _id: "r1" }, { _id: "r2" }],
      total: 2,
    });

    await expect(
      reportService.listReportsForAdmin({ status: "Open", targetType: "Post" }),
    ).resolves.toEqual({
      items: [{ _id: "r1" }],
      total: 1,
    });
  });

  it("updateStatusForAdmin validates status and missing reports", async () => {
    await expect(
      reportService.updateStatusForAdmin(target, "Closed"),
    ).rejects.toThrow("Status must be Open, Reviewed, or Dismissed");

    mockReportRepository.updateStatusById.mockResolvedValue(null);
    await expect(
      reportService.updateStatusForAdmin(target, "Reviewed"),
    ).rejects.toThrow("Report not found");
  });
});
