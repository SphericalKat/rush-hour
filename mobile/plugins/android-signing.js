const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function androidSigningPlugin(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("signingConfigs.release")) {
      contents = contents.replace(
        /signingConfigs\s*\{/,
        `signingConfigs {
        release {
            storeFile file('../../upload-keystore.jks')
            storePassword findProperty('RUSH_HOUR_STORE_PASSWORD') ?: ''
            keyAlias findProperty('RUSH_HOUR_KEY_ALIAS') ?: ''
            keyPassword findProperty('RUSH_HOUR_KEY_PASSWORD') ?: ''
        }`
      );

      contents = contents.replace(
        /(\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n\s*)signingConfig signingConfigs\.debug/,
        "$1signingConfig signingConfigs.release"
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
