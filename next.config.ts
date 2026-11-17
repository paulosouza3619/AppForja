import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ncyiriwthookmmdeisbs.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeWlyaXd0aG9va21tZGVpc2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4MzI4NjEsImV4cCI6MjEwOTQwODg2MX0.h23hJGJ9ynhlBSuzUSRL_rEuKPc-LJ5rckGhXp9bxXg",
  },
};

export default nextConfig;
