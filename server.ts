import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Fabrica del servidor MCP -------------------------------------------------
// En modo "stateless" creamos una instancia nueva por cada peticion. Esto es lo
// mas robusto para entornos como Cloud Run (sin estado, multiples instancias).
function createMcpServer(): McpServer {
  const mcp = new McpServer({
    name: "TejedoraNarrativaMCP",
    version: "1.0.0",
  });

  mcp.tool(
    "get_project_plan",
    "Obtiene el plan narrativo completo (proyecto, historia, personajes, objetos del mundo) guardado desde la aplicacion web",
    {},
    async () => {
      try {
        const dataPath = path.join(process.cwd(), "projectData.json");
        const data = await fs.readFile(dataPath, "utf8");
        return {
          content: [{ type: "text", text: data }],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: "Aun no hay datos. Abre la app en el navegador y espera a que guarde.",
            },
          ],
        };
      }
    }
  );

  return mcp;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const httpServer = createServer(app);

  app.use(cors({ origin: true, credentials: true }));
  app.options('*all', cors({ origin: true, credentials: true }) as any);
  app.use(express.json({ limit: "50mb" }));

  // --- ENDPOINT MCP (Streamable HTTP) ----------------------------------------
  // Un solo endpoint POST /mcp. Es lo que esperan los conectores de Claude.
  app.post("/mcp", async (req, res) => {
    try {
      const mcp = createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // modo stateless
      });

      res.on("close", () => {
        transport.close();
        mcp.close();
      });

      await mcp.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (e) {
      console.error("Error en /mcp:", e);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  // En modo stateless no hay stream servidor->cliente ni sesiones que cerrar.
  app.get("/mcp", (_req, res) => {
    res
      .status(405)
      .json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed (stateless mode). Usa POST." },
        id: null,
      });
  });
  // ---------------------------------------------------------------------------

  // Rutas API normales de la app
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/syncPlan", async (req, res) => {
    try {
      const dataPath = path.join(process.cwd(), "projectData.json");
      await fs.writeFile(dataPath, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (e) {
      console.error("Error saving plan:", e);
      res.status(500).json({ error: "Failed to sync plan context" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MCP endpoint:    http://localhost:${PORT}/mcp`);
  });
}

startServer();
