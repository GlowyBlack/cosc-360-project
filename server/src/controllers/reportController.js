import reportService from "../services/reportService.js";

function handleError(res, err) {
  if (err && typeof err.status === "number") {
    return res.status(err.status).json({ message: err.message });
  }
  return res.status(500).json({ message: "Server Error" });
}

const ReportController = {
  async create(req, res) {
    try {
      const reporterId = req.user?._id ?? req.user?.id;
      const report = await reportService.createReport(reporterId, req.body ?? {});
      return res.status(201).json(report);
    } catch (err) {
      return handleError(res, err);
    }
  },

  async listMine(req, res) {
    try {
      const reporterId = req.user?._id ?? req.user?.id;
      const result = await reportService.listMyReports(reporterId);
      return res.status(200).json(result);
    } catch (err) {
      return handleError(res, err);
    }
  },
};

export default ReportController;
