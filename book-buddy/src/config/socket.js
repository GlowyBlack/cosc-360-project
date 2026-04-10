import { io } from "socket.io-client";
import API from "./api.js";

/** Socket.IO base URL matches REST API (same host in Docker + production). */
export function createAppSocket() {
  return io(API, { withCredentials: true });
}
