// const path = require("path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
// const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const CopyWebpackPlugin = require("copy-webpack-plugin");

// module.exports = {
//   entry: {
//     popup: "./src/popup.tsx",
//     background: "./src/background.ts",
//   },
//   output: {
//     path: path.resolve(__dirname, "dist"),
//     filename: "[name].js",
//     clean: true,
//   },
//   resolve: {
//     extensions: [".ts", ".tsx", ".js", ".jsx"],
//   },
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: "ts-loader",
//         exclude: /node_modules/,
//       },
//       {
//         test: /\.html$/,
//         use: "html-loader",
//       },
//       {
//         test: /\.css$/,
//         use: ["style-loader", "css-loader"],
//       },
//     ],
//   },
//   plugins: [
//     new CleanWebpackPlugin(),
//     new HtmlWebpackPlugin({
//       template: "./public/popup.html",
//       filename: "popup.html",
//       chunks: ["popup"],
//     }),
//     new CopyWebpackPlugin({
//       patterns: [
//         { from: "public/manifest.json", to: "manifest.json" }, // Copy manifest.json
//         // { from: "public/icons", to: "icons" }, // Copy icons folder if exists
//       ],
//     }),
//   ],
//   devtool: "source-map",
//   mode: "development",
// };

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const fs = require("fs");

module.exports = (env, argv) => {
  // Determine whether to use Chrome or Firefox manifest
  const isChrome = process.env.BROWSER === "chrome";
  const manifestPath = isChrome ? "public/manifest.chrome.json" : "public/manifest.firefox.json";

  // Check if the manifest file exists
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`);
  }
  const browserFolder = isChrome ? "chrome" : "firefox";
  return {
    entry: {
      popup: "./src/popup.tsx",
      background: "./src/background.ts",
      content: "./src/content.ts",
    },
    output: {
      path: path.resolve(__dirname, `dist/${browserFolder}`),
      filename: "[name].js",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.html$/,
          use: "html-loader",
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: "./public/popup.html",
        filename: "popup.html",
        chunks: ["popup"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: "public/img", to: "img" },
          { from: "icons", to: "icons", context: "." },
          { from: manifestPath, to: "manifest.json" }, // Copy dynamic manifest
          // { from: "public/icons", to: "icons" }, // Copy icons folder if exists
        ],
      }),
    ],
    devtool: "source-map",
    mode: argv.mode || "development", // Mode based on build argument
  };
};
