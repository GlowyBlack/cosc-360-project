import reportService from "../services/reportService.js";
import { sendServiceError } from "../utils/httpError.js";

const ReportController = {
  async create(req, res) {
    try {
      const reporterId = req.user?._id ?? req.user?.id;
      const report = await reportService.createReport(reporterId, req.body ?? {});
      return res.status(201).json(report);
    } catch (err) {
      return sendServiceError(res, err);
    }
  },

  async listMine(req, res) {
    try {
      const reporterId = req.user?._id ?? req.user?.id;
      const result = await reportService.listMyReports(reporterId);
      return res.status(200).json(result);
    } catch (err) {
      return sendServiceError(res, err);
    }
  },
};

export default ReportController;
