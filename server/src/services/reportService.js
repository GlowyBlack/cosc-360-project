import mongoose from "mongoose";
import reportRepository from "../repositories/reportRepository.js";
import bookRepository from "../repositories/bookRepository.js";
import userRepository from "../repositories/userRepository.js";
import postRepository from "../repositories/postRepository.js";
import commentRepository from "../repositories/commentRepository.js";

const TARGET_TYPES = new Set(["Post", "Comment", "User", "Book"]);
const ADMIN_PATCH_STATUSES = new Set(["Open", "Reviewed", "Dismissed"]);


async function targetExists(targetType, targetId) {
  switch (targetType) {
    case "Book": {
      const b = await bookRepository.findByID({ id: targetId, lean: true });
      return Boolean(b);
    }
    case "User": {
      const u = await userRepository.findById(targetId);
      return Boolean(u);
    }
    case "Post": {
      const p = await postRepository.findById(targetId);
      return Boolean(p);
    }
    case "Comment": {
      const c = await commentRepository.findById(targetId);
      return Boolean(c);
    }
    default:
      return false;
  }
}

const ReportService = {
  async createReport(reporterId, { targetType, targetId, reason }) {
    if (!reporterId || !mongoose.isValidObjectId(String(reporterId))) throw new Error("Invalid reporter");

    const type = String(targetType ?? "").trim();
    if (!TARGET_TYPES.has(type)) throw new Error("Invalid target type");
    const tid = String(targetId ?? "").trim();
    if (!mongoose.isValidObjectId(tid)) throw new Error("Invalid target id");
    

    let cleanReason = String(reason ?? "").trim();
    if (cleanReason.length > 2000) {
      cleanReason = cleanReason.slice(0, 2000);
    }

    const exists = await targetExists(type, tid);
    if (!exists) throw new Error("Report target not found");

    const dup = await reportRepository.findOpenByReporterAndTarget(
      reporterId,
      type,
      tid,
    );
    if (dup) throw new Error("You already have an open report for this item");

    const created = await reportRepository.createReport({
      reporterId,
      targetType: type,
      targetId: tid,
      reason: cleanReason,
      status: "Open",
    });

    const doc = Array.isArray(created) ? created[0] : created;
    return reportRepository.findById(doc._id);
  },

  async listMyReports(reporterId) {
    if (!reporterId || !mongoose.isValidObjectId(String(reporterId))) {
      throw new Error("Invalid user");
    }
    const items = await reportRepository.findAllByReporter(reporterId);
    return { items, total: items.length };
  },

  async listReportsForAdmin({ status, targetType } = {}) {
    const statusFilter = String(status ?? "").trim();
    if (statusFilter && !ADMIN_PATCH_STATUSES.has(statusFilter)) {
      throw new Error("Invalid status");
    }

    const typeFilter = String(targetType ?? "").trim();
    if (typeFilter && !TARGET_TYPES.has(typeFilter)) {
      throw new Error("Invalid target type");
    }

    const items = await reportRepository.findAll({
      status: statusFilter || undefined,
      targetType: typeFilter || undefined,
    });
    return { items, total: items.length };
  },

  async getByIdForAdmin(reportId) {
    if (!reportId || !mongoose.isValidObjectId(String(reportId))) {
      throw new Error("Invalid report id");
    }
    const row = await reportRepository.findById(reportId);
    if (!row) {
      throw new Error("Report not found");
    }
    return row;
  },

  async updateStatusForAdmin(reportId, status) {
    if (!reportId || !mongoose.isValidObjectId(String(reportId))) {
      throw new Error("Invalid report id");
    }
    const next = String(status ?? "").trim();
    if (!ADMIN_PATCH_STATUSES.has(next)) {
      throw new Error("Status must be Open, Reviewed, or Dismissed");
    }
    const updated = await reportRepository.updateStatusById(reportId, next);
    if (!updated) {
      throw new Error("Report not found");
    }
    return updated;
  },

  async resolveReportForAdmin(reportId) {
    return this.updateStatusForAdmin(reportId, "Reviewed");
  },

  async unresolveReportForAdmin(reportId) {
    return this.updateStatusForAdmin(reportId, "Open");
  },
};

export default ReportService;
