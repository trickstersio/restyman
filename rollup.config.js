import babel from 'rollup-plugin-babel'
import filesize from 'rollup-plugin-filesize'
import uglify from 'rollup-plugin-uglify'

const isProduction = process.env.NODE_ENV === 'production'

const destBase = 'dist/restyman'
const destExtension = `${isProduction ? '.min' : ''}.js`

export default {
  input: 'src/index.js',
  name: 'restyman',
  exports: 'named',
  output: [
    { file: `${destBase}${destExtension}`, format: 'cjs' }
  ],
  plugins: [
    babel({
      babelrc: false,
      presets: [
        [
          'es2015',
          {
            modules: false
          }
        ]
      ],
      plugins: [
        'transform-object-rest-spread'
      ]
    }),
    isProduction && uglify(),
    filesize()
  ].filter((plugin) => !!plugin)
}
