const { withAppBuildGradle } = require("expo/config-plugins");

module.exports = function androidSigningPlugin(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Add release signing config block next to the debug one
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

    // In the release buildType, swap debug signing for release.
    // The generated file has exactly one "signingConfig signingConfigs.debug"
    // inside the release block, preceded by a comment about generating a keystore.
    contents = contents.replace(
      /(\/\/ see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\n\s*)signingConfig signingConfigs\.debug/,
      "$1signingConfig signingConfigs.release"
    );

    config.modResults.contents = contents;
    return config;
  });
};
