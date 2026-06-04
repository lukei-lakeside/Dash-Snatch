import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
        hunt: resolve(root, "hunt.html"),
        map: resolve(root, "map.html"),
        feed: resolve(root, "feed.html"),
        friends: resolve(root, "friends.html"),
        leaders: resolve(root, "leaders.html"),
        profile: resolve(root, "profile.html"),
        settings: resolve(root, "settings.html")
      }
    }
  },
  server: {
    port: 5173
  }
});
