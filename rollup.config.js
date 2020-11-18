import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';

function plugins() {
    return [nodeResolve(), typescript({
        tsconfigOverride: {
            compilerOptions: { module: 'esnext' }
        }
    })];
}

export default [{
    input: './src/index.ts',
    plugins: plugins(),
    output: [{
        file: 'dist/emmet.cjs.js',
        format: 'cjs',
        exports: 'auto',
        sourcemap: true
    }, {
        file: 'dist/emmet.es.js',
        format: 'es',
        sourcemap: true
    }, {
        file: 'dist/emmet.browser.js',
        format: 'iife',
        name: 'emmet',
        sourcemap: true
    }]
}];
