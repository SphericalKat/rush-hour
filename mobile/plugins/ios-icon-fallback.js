const { withDangerousMod, IOSConfig } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function iosIconFallbackPlugin(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = config.modRequest.projectName;
      const iosRoot = path.join(projectRoot, "ios", projectName);
      const appiconsetDir = path.join(
        iosRoot,
        "Images.xcassets",
        "AppIcon.appiconset"
      );

      await fs.promises.mkdir(appiconsetDir, { recursive: true });

      const src = path.join(projectRoot, "assets", "AppIcon.png");
      const dest = path.join(appiconsetDir, "App-Icon-1024x1024@1x.png");
      await fs.promises.copyFile(src, dest);

      const contents = {
        images: [
          {
            filename: "App-Icon-1024x1024@1x.png",
            idiom: "universal",
            platform: "ios",
            size: "1024x1024",
          },
        ],
        info: { version: 1, author: "expo" },
      };
      await fs.promises.writeFile(
        path.join(appiconsetDir, "Contents.json"),
        JSON.stringify(contents, null, 2)
      );

      return config;
    },
  ]);
};
