const { join } = require('path');
const babel = require('rollup-plugin-babel');
const alias = require('rollup-plugin-alias');
const {terser} = require('rollup-plugin-terser');
const {visualizer} = require('rollup-plugin-visualizer')

const cwd = __dirname;

const baseConfig = {
    // input: join(cwd, 'src/index.js'),
    // input: join(cwd, 'diy-demo/canvasJS/canvasImgEditor.js'), // 整体js文件
    input: join(cwd, 'diy-demo/canvasJS/modularity/canvasImgEditor.js'), // 模块化拆分后的js文件
    external: ['react', 'react-dom', 'jquery'],
    output: [
        {
            file: join(cwd, 'dist/index.js'),
            format: 'cjs',
            sourcemap: true,
            exports: 'named'
        }
    ],
    plugins: [
        alias({
            entries: [
                // {
                //     find: 'fabric',
                //     replacement: join(cwd, 'node_modules/fabric/dist/fabric.js')
                // }
            ]
        }),
        babel(),
        // 添加 terser 插件进行代码压缩  
        terser({  
            compress: {  
                // 你可以在这里配置 terser 的压缩选项  
                // 例如：drop_console: true, // 删除所有的 `console` 语句 
                drop_console: true 
            },  
            mangle: true, // 混淆变量名  
            output: {  
                comments: false, // 删除所有注释  
            },
        }),
        // 成果物分析
        visualizer() 
    ]
};
const esmConfig = {
    ...baseConfig,
    output: {
        ...baseConfig.output,
        // sourcemap: true,
        format: 'es',
        file: join(cwd, 'dist/index.esm.js')
    }
};

function rollup() {
    const target = process.env.TARGET;
    console.log('target', target);
    if (target === 'umd') {
        return baseConfig;
    }
    if (target === 'esm') {
        return esmConfig;
    }
    // return [baseConfig, esmConfig];
    return [esmConfig];
}
module.exports = rollup();
