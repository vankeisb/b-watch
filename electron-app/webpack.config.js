const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
    {
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
                include: /src/,
                use: ['style-loader', 'css-loader'],
            }]
        },
        output: {
            path: __dirname + '/build',
            filename: 'react.js'
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html'
            })
        ]
    }
];
