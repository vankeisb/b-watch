const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [
    {
        mode: "development",
        entry: './src/electron.ts',
        target: 'electron-main',
        devtool: 'source-map',
        module: {
            rules: [{
                test: /\.ts$/,
                include: /src/,
                use: [{loader: 'ts-loader'}]
            }]
        },
        output: {
            path: __dirname + '/build',
            filename: 'electron.js'
        }
    },
    {
        mode: "development",
        entry: './src/react.tsx',
        target: 'electron-renderer',
        devtool: 'source-map',
        module: {
            rules: [{
                test: /\.ts(x?)$/,
                include: /src/,
                use: [{loader: 'ts-loader'}]
            },{
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            }]
        },
        output: {
            path: __dirname + '/build',
            filename: 'react.js'
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html'
            }),
            new MiniCssExtractPlugin({
                filename: "[name].css",
                chunkFilename: "[id].css"
            })
        ]
    }
];
