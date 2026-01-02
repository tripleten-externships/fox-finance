// vite.config.ts
import { defineConfig } from "file:///C:/Users/johnz/OneDrive/Desktop/fox-finance/node_modules/.pnpm/vite@5.4.20_@types+node@24.5.2/node_modules/vite/dist/node/index.js";
import dts from "file:///C:/Users/johnz/OneDrive/Desktop/fox-finance/node_modules/.pnpm/vite-plugin-dts@3.9.1_@type_70f09b9b53a8740cbf6011782b93fbda/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";
var __vite_injected_original_dirname = "C:\\Users\\johnz\\OneDrive\\Desktop\\fox-finance\\packages\\theme";
var vite_config_default = defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      include: ["src/**/*"],
      exclude: ["**/*.test.*", "**/*.spec.*"]
    }),
    // Custom plugin to copy CSS files
    {
      name: "copy-css-files",
      writeBundle() {
        mkdirSync(resolve(__vite_injected_original_dirname, "dist/styles"), { recursive: true });
        copyFileSync(
          resolve(__vite_injected_original_dirname, "src/styles/globals.css"),
          resolve(__vite_injected_original_dirname, "dist/styles/globals.css")
        );
      }
    }
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        "tailwind/index": resolve(__vite_injected_original_dirname, "src/tailwind/index.ts")
      },
      name: "FoxFinanceTheme",
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM"
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqb2huelxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGZveC1maW5hbmNlXFxcXHBhY2thZ2VzXFxcXHRoZW1lXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxqb2huelxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXGZveC1maW5hbmNlXFxcXHBhY2thZ2VzXFxcXHRoZW1lXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9qb2huei9PbmVEcml2ZS9EZXNrdG9wL2ZveC1maW5hbmNlL3BhY2thZ2VzL3RoZW1lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb3B5RmlsZVN5bmMsIG1rZGlyU3luYyB9IGZyb20gXCJmc1wiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbXHJcbiAgICBkdHMoe1xyXG4gICAgICBpbnNlcnRUeXBlc0VudHJ5OiB0cnVlLFxyXG4gICAgICByb2xsdXBUeXBlczogZmFsc2UsXHJcbiAgICAgIGluY2x1ZGU6IFtcInNyYy8qKi8qXCJdLFxyXG4gICAgICBleGNsdWRlOiBbXCIqKi8qLnRlc3QuKlwiLCBcIioqLyouc3BlYy4qXCJdLFxyXG4gICAgfSksXHJcbiAgICAvLyBDdXN0b20gcGx1Z2luIHRvIGNvcHkgQ1NTIGZpbGVzXHJcbiAgICB7XHJcbiAgICAgIG5hbWU6IFwiY29weS1jc3MtZmlsZXNcIixcclxuICAgICAgd3JpdGVCdW5kbGUoKSB7XHJcbiAgICAgICAgLy8gRW5zdXJlIHRoZSBzdHlsZXMgZGlyZWN0b3J5IGV4aXN0cyBpbiBkaXN0XHJcbiAgICAgICAgbWtkaXJTeW5jKHJlc29sdmUoX19kaXJuYW1lLCBcImRpc3Qvc3R5bGVzXCIpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgLy8gQ29weSB0aGUgZ2xvYmFscy5jc3MgZmlsZVxyXG4gICAgICAgIGNvcHlGaWxlU3luYyhcclxuICAgICAgICAgIHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9zdHlsZXMvZ2xvYmFscy5jc3NcIiksXHJcbiAgICAgICAgICByZXNvbHZlKF9fZGlybmFtZSwgXCJkaXN0L3N0eWxlcy9nbG9iYWxzLmNzc1wiKVxyXG4gICAgICAgICk7XHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIF0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIGxpYjoge1xyXG4gICAgICBlbnRyeToge1xyXG4gICAgICAgIGluZGV4OiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvaW5kZXgudHNcIiksXHJcbiAgICAgICAgXCJ0YWlsd2luZC9pbmRleFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvdGFpbHdpbmQvaW5kZXgudHNcIiksXHJcbiAgICAgIH0sXHJcbiAgICAgIG5hbWU6IFwiRm94RmluYW5jZVRoZW1lXCIsXHJcbiAgICAgIGZvcm1hdHM6IFtcImVzXCIsIFwiY2pzXCJdLFxyXG4gICAgfSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgZXh0ZXJuYWw6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBnbG9iYWxzOiB7XHJcbiAgICAgICAgICByZWFjdDogXCJSZWFjdFwiLFxyXG4gICAgICAgICAgXCJyZWFjdC1kb21cIjogXCJSZWFjdERPTVwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdYLFNBQVMsb0JBQW9CO0FBQzdZLE9BQU8sU0FBUztBQUNoQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjLGlCQUFpQjtBQUh4QyxJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsTUFDRixrQkFBa0I7QUFBQSxNQUNsQixhQUFhO0FBQUEsTUFDYixTQUFTLENBQUMsVUFBVTtBQUFBLE1BQ3BCLFNBQVMsQ0FBQyxlQUFlLGFBQWE7QUFBQSxJQUN4QyxDQUFDO0FBQUE7QUFBQSxJQUVEO0FBQUEsTUFDRSxNQUFNO0FBQUEsTUFDTixjQUFjO0FBRVosa0JBQVUsUUFBUSxrQ0FBVyxhQUFhLEdBQUcsRUFBRSxXQUFXLEtBQUssQ0FBQztBQUdoRTtBQUFBLFVBQ0UsUUFBUSxrQ0FBVyx3QkFBd0I7QUFBQSxVQUMzQyxRQUFRLGtDQUFXLHlCQUF5QjtBQUFBLFFBQzlDO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLFFBQ3hDLGtCQUFrQixRQUFRLGtDQUFXLHVCQUF1QjtBQUFBLE1BQzlEO0FBQUEsTUFDQSxNQUFNO0FBQUEsTUFDTixTQUFTLENBQUMsTUFBTSxLQUFLO0FBQUEsSUFDdkI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVUsQ0FBQyxTQUFTLFdBQVc7QUFBQSxNQUMvQixRQUFRO0FBQUEsUUFDTixTQUFTO0FBQUEsVUFDUCxPQUFPO0FBQUEsVUFDUCxhQUFhO0FBQUEsUUFDZjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
