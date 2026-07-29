import createMiddleware from "next-intl/middleware";
import { routing } from "./lib/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for API routes, static files, and _next
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};