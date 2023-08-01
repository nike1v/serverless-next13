const parsedNextConfigurationFactory = (
  nextConfiguration = {
    output: "standalone",
    distDir: ".next"
  },
  staticAssetsBucket = "my-bucket"
) => ({
  staticAssetsBucket,
  nextConfiguration
});

module.exports = parsedNextConfigurationFactory;
