const { withGradleProperties } = require("expo/config-plugins");

module.exports = function androidJvmArgsPlugin(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;
    const existing = props.find(
      (p) => p.type === "property" && p.key === "org.gradle.jvmargs"
    );
    if (existing) {
      existing.value = "-Xmx4096m -XX:MaxMetaspaceSize=512m";
    } else {
      props.push({
        type: "property",
        key: "org.gradle.jvmargs",
        value: "-Xmx4096m -XX:MaxMetaspaceSize=512m",
      });
    }
    return config;
  });
};
