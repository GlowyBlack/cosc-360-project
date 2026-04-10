import report from "../models/report.js";

const ReportRepository = {
  async createReport(data) {
    return report.create(data);
  },

  async findById(id) {
    return report
      .findById(id)
      .populate({ path: "reporterId", select: "username email profileImage" })
      .lean();
  },

  async findOpenByReporterAndTarget(reporterId, targetType, targetId) {
    return report
      .findOne({
        reporterId,
        targetType,
        targetId,
        status: "Open",
      })
      .lean();
  },

  async findAllByReporter(reporterId) {
    return report
      .find({ reporterId })
      .sort({ createdAt: -1 })
      .lean();
  },

  async findAll({ status, targetType } = {}) {
    const query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    return report
      .find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "reporterId", select: "username email profileImage" })
      .lean();
  },

  async updateStatusById(id, status) {
    const updated = await report.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after", runValidators: true },
    );
    if (!updated) return null;
    return report
      .findById(updated._id)
      .populate({ path: "reporterId", select: "username email profileImage" })
      .lean();
  },
};

export default ReportRepository;
