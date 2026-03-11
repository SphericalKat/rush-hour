const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function androidFlavorsPlugin(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add flavorDimensions and productFlavors inside android { }
    contents = contents.replace(
      /(defaultConfig\s*\{[\s\S]*?\n    \})/,
      `$1

    flavorDimensions "distribution"
    productFlavors {
        play {
            dimension "distribution"
        }
        fdroid {
            dimension "distribution"
        }
    }`
    );

    // Update debuggableVariants to include flavor variants
    contents = contents.replace(
      /\/\/\s*debuggableVariants = \["liteDebug", "prodDebug"\]/,
      'debuggableVariants = ["playDebug", "fdroidDebug"]'
    );

    config.modResults.contents = contents;
    return config;
  });
};
