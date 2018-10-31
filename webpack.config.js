const path = require("path");

module.exports = {
  cache: true,
  entry: "./src/entry.tsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: [{ loader: "ts-loader" }], exclude: /node_modules/ }
    ]
  }
}