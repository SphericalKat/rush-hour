const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function androidAbiSplitsPlugin(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("splits {")) {
      contents = contents.replace(
        /(defaultConfig\s*\{[\s\S]*?\n    \})/,
        `$1
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "armeabi-v7a", "arm64-v8a"
        }
    }`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
