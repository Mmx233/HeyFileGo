import axios from "axios";
export const api = axios.create({ baseURL: "/api/" });
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const message: unknown = error.response?.data?.msg;
    if (typeof message === "string" && message) return message;
    if (!error.response)
      return "Could not reach this device. Check the connection and try again.";
  }
  return fallback;
}
export default api;
