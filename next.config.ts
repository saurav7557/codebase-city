import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile Three.js and React Three Fiber packages for proper ESM handling
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
