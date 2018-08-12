const path = require("path");

module.exports = {
    entry: require.resolve("./js/stickyElement.js"),
    mode: 'production',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "stickyElement.js",
        libraryTarget: 'var',
        library: 'StickyElements'
    },
    watchOptions: {
        poll: 1000 // Check for changes every second
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