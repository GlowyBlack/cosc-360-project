import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

process.env.VITE_API_URL = process.env.VITE_API_URL || "http://localhost:5001";

if (typeof globalThis.URL.createObjectURL !== "function") {
  globalThis.URL.createObjectURL = () => "blob:http://localhost/mock-object-url";
}
if (typeof globalThis.URL.revokeObjectURL !== "function") {
  globalThis.URL.revokeObjectURL = () => {};
}
