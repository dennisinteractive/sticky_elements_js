const path = require("path");

module.exports = {
    entry: require.resolve("./js/stickyElements.js"),
    mode: 'production',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "stickyElements.min.js",
        libraryTarget: 'umd',
        library: 'library'
    },
    watchOptions: {
        poll: 200 // Check for changes every second
    },
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: "babel-loader"
            }
        ]
    }
};