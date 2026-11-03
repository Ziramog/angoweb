// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  vite: {
    build: {
      // Astro inlines page scripts only while they stay under assetsInlineLimit (4 KB default).
      // The shared analytics script needs to keep shipping inline in every page; CSS and images
      // keep the stock 4 KB behaviour so their delivery does not change.
      assetsInlineLimit: (filePath, content) =>
        filePath.endsWith('.js') ? true : content.length < 4096
    }
  }
});