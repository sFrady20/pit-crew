module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
    }
    return config;
  },
};
