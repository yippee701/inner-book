import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'node_modules', 'build', '*.config.js'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^[A-Z_]',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-debugger': 'warn', // 警告而不是错误
      'react-hooks/immutability': 'off', // 允许修改对象属性
      'react-hooks/set-state-in-effect': 'warn', // 允许在 effect 中设置状态（某些场景需要）
      'react-hooks/exhaustive-deps': 'warn', // 依赖项检查改为警告
      'react-hooks/use-memo': 'warn', // useCallback 使用改为警告
      'react-refresh/only-export-components': 'warn', // 允许导出 hooks 和函数
    },
  },
]
