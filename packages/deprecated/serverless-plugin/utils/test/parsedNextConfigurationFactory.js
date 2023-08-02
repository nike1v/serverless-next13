const parsedNextConfigurationFactory = (
  nextConfiguration = {
    distDir: ".next"
  },
  staticAssetsBucket = "my-bucket"
) => ({
  staticAssetsBucket,
  nextConfiguration
});

module.exports = parsedNextConfigurationFactory;
