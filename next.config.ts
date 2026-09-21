import type { NextConfig } from "next";

// Baseline security headers, site-wide. No CSP here on purpose: this app
// leans on inline `style={{...}}` throughout (grep the codebase) and a
// strict CSP that actually locks down script-src/style-src needs either
// nonces threaded through every render or a broad 'unsafe-inline', which
// isn't a real security boundary and risks breaking pages without far
// more testing than this pass covers — left as a follow-up rather than
// shipped half-verified.
const securityHeaders = [
  // Prevents the page from being framed by another origin (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Stops the browser from MIME-sniffing a response away from its
  // declared Content-Type (e.g. treating an uploaded image as HTML/JS).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Sends the full referrer only to same-origin requests; cross-origin
  // requests get just the origin, not the full path/query.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Opts out of browser features this app never uses.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
