
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Resolve HTTP status from a thrown error (Mongoose CastError, httpError, or legacy statusCode).
 */
export function serviceErrorStatus(err, defaultStatus = 500) {
  if (!err || typeof err !== "object") return defaultStatus;
  if (err.name === "CastError") return 400;
  const s = err.status;
  if (typeof s === "number" && s >= 400 && s < 600) return s;
  const legacy = err.statusCode;
  if (typeof legacy === "number" && legacy >= 400 && legacy < 600) return legacy;
  return defaultStatus;
}

/** Send JSON error from a caught service/Mongoose error (logs on 5xx). */
export function sendServiceError(res, err, { jsonKey = "message" } = {}) {
  const status = serviceErrorStatus(err);
  if (status >= 500) console.error(err);
  const msg = err && typeof err === "object" && "message" in err && err.message
    ? String(err.message)
    : "Server Error";
  return res.status(status).json({ [jsonKey]: msg });
}
