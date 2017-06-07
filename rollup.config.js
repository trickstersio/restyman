import babel from 'rollup-plugin-babel';
import filesize from 'rollup-plugin-filesize';
import uglify from 'rollup-plugin-uglify';

const isProduction = process.env.NODE_ENV === 'production';

const destBase = 'dist/restyman'
const destExtension = `${isProduction ? '.min' : ''}.js`;

export default {
  entry: 'index.js',
  moduleName: 'restyman',
  targets: [
    { dest: `${destBase}${destExtension}`, format: 'cjs' },
  ],
  external: [ 'lodash/forEach' ],
  plugins: [
    babel({ babelrc: false, presets: [ 'es2015-rollup', 'stage-1' ] }),
    isProduction && uglify(),
    filesize(),
  ].filter((plugin) => !!plugin)
};
