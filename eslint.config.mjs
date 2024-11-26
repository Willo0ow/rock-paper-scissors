import withNuxt from './.nuxt/eslint.config.mjs';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default withNuxt([
  {
    ignores: ['node_modules/', 'dist/', '.nuxt/'],
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      ...eslintPluginPrettierRecommended.rules,

      'no-console': 'warn',
      'vue/multi-word-component-names': 'off',
      'vue/no-multiple-template-root': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'vue/no-v-html': 'off',
    },
  },
]);
