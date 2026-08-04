/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 独立输出，包含所有依赖
  output: "standalone",

  // 生产环境优化
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
