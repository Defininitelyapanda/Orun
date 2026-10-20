import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async headers(){return[{source:"/:path*",headers:[{key:"X-Content-Type-Options",value:"nosniff"},{key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},{key:"X-Frame-Options",value:"DENY"},{key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(self)"},{key:"Content-Security-Policy",value:"default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; img-src 'self' data: https://i.ytimg.com https:; media-src 'self' blob: https:; frame-src https://www.youtube-nocookie.com https://www.youtube.com; script-src 'self' 'unsafe-inline' https://www.youtube.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; upgrade-insecure-requests"}]}]}
};

export default nextConfig;
