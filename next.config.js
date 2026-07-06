/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure the raw system prompt markdown is bundled into the serverless
  // function that reads it at runtime (lib/system-prompt.ts).
  outputFileTracingIncludes: {
    '/api/classer': ['./lib/system-prompt.md'],
  },
};

module.exports = nextConfig;
