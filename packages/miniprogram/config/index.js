const path = require('path');

// 解决 React 18 下 jsx-runtime 的 exports 解析问题，并保证 react 与 jsx-runtime 使用同一实例（避免 ReactCurrentBatchConfig 等 internals 为 undefined）
const reactDir = path.dirname(require.resolve('react/package.json', { paths: [path.join(__dirname, '..')] }));
const isDev = process.env.NODE_ENV !== 'production';
const reactMain = path.join(reactDir, isDev ? 'cjs/react.development.js' : 'cjs/react.production.min.js');
const reactJsxRuntime = path.join(reactDir, isDev ? 'cjs/react-jsx-runtime.development.js' : 'cjs/react-jsx-runtime.production.min.js');
const reactJsxDevRuntime = path.join(reactDir, isDev ? 'cjs/react-jsx-dev-runtime.development.js' : 'cjs/react-jsx-dev-runtime.production.min.js');

const config = {
  projectName: 'know-yourself-mp',
  date: '2026-2-12',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    375: 2,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  copy: {
    patterns: [],
    options: {},
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  alias: {
    '@know-yourself/core': path.resolve(__dirname, '../../core/src/index.js'),
    '@know-yourself/core/adapters': path.resolve(__dirname, '../../core/src/adapters/index.js'),
    // 子路径必须写在 react 前面，否则 resolve('react/jsx-runtime') 会先被 react 匹配成 reactMain + '/jsx-runtime'
    'react/jsx-runtime': reactJsxRuntime,
    'react/jsx-dev-runtime': reactJsxDevRuntime,
    react: reactMain,
  },
  mini: {
    // 让 Babel 转译 @know-yourself/core（含 ?.、?? 等），否则小程序运行时报 SyntaxError: Unexpected token .
    compile: {
      include: [
        path.resolve(__dirname, '../../core'),
      ],
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
};

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'));
  }
  return merge({}, config, require('./prod'));
};
