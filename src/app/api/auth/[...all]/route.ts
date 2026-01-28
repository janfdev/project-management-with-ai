
import { auth } from "@/lib/auth"; // Make sure to export { auth } from @/lib/auth
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
