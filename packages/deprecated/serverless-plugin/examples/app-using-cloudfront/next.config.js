const withCSS = require("@zeit/next-css");

const config = {
  output: "standalone"
};

module.exports = withCSS(config);
