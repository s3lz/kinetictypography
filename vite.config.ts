import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { handleCreativeDirectionRequest } from "./server/api";

function creativeDirectionApiPlugin(): Plugin {
  const registerMiddleware = (
    middlewares: {
      use: (
        handler: (
          req: Parameters<typeof handleCreativeDirectionRequest>[0],
          res: Parameters<typeof handleCreativeDirectionRequest>[1],
          next: () => void
        ) => void
      ) => void;
    },
    envDir: string,
    mode: string
  ) => {
    const env = loadEnv(mode, envDir, "");
    if (env.GEMINI_API_KEY) {
      process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
    }

    middlewares.use((req, res, next) => {
      if (req.url !== "/api/creative-direction") {
        next();
        return;
      }

      void handleCreativeDirectionRequest(req, res);
    });
  };

  return {
    name: "creative-direction-api",
    configureServer(server) {
      const envDir =
        typeof server.config.envDir === "string"
          ? server.config.envDir
          : process.cwd();
      registerMiddleware(server.middlewares, envDir, server.config.mode);
    },
    configurePreviewServer(server) {
      const envDir =
        typeof server.config.envDir === "string"
          ? server.config.envDir
          : process.cwd();
      registerMiddleware(server.middlewares, envDir, server.config.mode);
    },
  };
}

export default defineConfig({
  plugins: [react(), creativeDirectionApiPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
