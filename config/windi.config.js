import { defineConfig } from 'windicss/helpers';
const { join } = require('path');

export default defineConfig({
  extract: {
    include: [
      join(process.cwd(), './src/renderer/index.html'),
      join(process.cwd(), './src/renderer') + '/**/*.{html,jsx,tsx}',
    ],
    exclude: [],
  },
});
