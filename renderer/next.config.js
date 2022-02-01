const WindiCSSWebpackPlugin = require("windicss-webpack-plugin");

module.exports = {
  webpack: (config, { isServer }) => {
    config.plugins = [...config.plugins, new WindiCSSWebpackPlugin()];
    return config;
  },
};
