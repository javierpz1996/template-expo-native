const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const paperEntry = path.resolve(
  __dirname,
  "node_modules/react-native-paper/lib/commonjs/index.js",
);

// NativeWind primero; después encadenamos el fix de Paper
const nativeWindConfig = withNativeWind(config, { input: "./global.css" });

const upstreamResolveRequest = nativeWindConfig.resolver.resolveRequest;

nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Evita el entry "react-native": "src/..." de Paper, que rompe en Windows
  if (moduleName === "react-native-paper") {
    return {
      type: "sourceFile",
      filePath: paperEntry,
    };
  }

  if (typeof upstreamResolveRequest === "function") {
    return upstreamResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
