const withCSS = require("@zeit/next-css");

const config = {
  output: "standalone",
  assetPrefix: "https://s3.amazonaws.com/foobarbazban"
};

module.exports = withCSS(config);
