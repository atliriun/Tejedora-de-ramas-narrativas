import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Utilidades de datos -----------------------------------------------------

const DATA_PATH = () => path.join(process.cwd(), "projectData.json");

async function loadData(): Promise<any | null> {
  try {
    const raw = await fs.readFile(DATA_PATH(), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Quita las imagenes (base64) de cualquier estructura, de forma recursiva.
// - node.images[]            -> imageCount: n
// - character.avatar         -> se elimina
// - character.expressions[]  -> solo {id, name} (sin imageUrl)
// - cualquier imageUrl       -> se elimina
function stripImages(value: any): any {
  if (Array.isArray(value)) return value.map(stripImages);
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "images" && Array.isArray(v)) {
        if (v.length) out.imageCount = v.length;
        continue;
      }
      if (k === "avatar") continue;
      if (k === "imageUrl") continue;
      if (k === "expressions" && Array.isArray(v)) {
        out.expressions = v.map((e: any) => ({ id: e?.id, name: e?.name }));
        continue;
      }
      out[k] = stripImages(v);
    }
    return out;
  }
  return value;
}

// Recorta strings largas para mantener acotado el tamaño.
function clamp(s: any, max = 1500): any {
  if (typeof s !== "string") return s;
  return s.length > max ? s.slice(0, max) + ` …[recortado, ${s.length} caracteres en total]` : s;
}

// Guarda de tamaño global por respuesta (protege el contexto de Claude).
const MAX_CHARS = 60000;
function withSizeGuard(text: string, hint: string): string {
  if (text.length <= MAX_CHARS) return text;
  return (
    text.slice(0, MAX_CHARS) +
    `\n\n…[RESPUESTA RECORTADA: ${text.length} caracteres. ${hint}]`
  );
}

function pretty(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

// Busca un nodo de escena por id en todos los arcos.
function findNode(arcs: any[], nodeId: string): any | null {
  const dfs = (node: any): any | null => {
    if (!node) return null;
    if (node.id === nodeId) return node;
    for (const child of node.children || []) {
      const r = dfs(child);
      if (r) return r;
    }
    return null;
  };
  for (const arc of arcs || []) {
    const r = dfs(arc.rootNode);
    if (r) return r;
  }
  return null;
}

// Indice ligero de escenas: id + titulo recortado + estructura (para navegar y
// luego leer con get_scene). En esta app el "name" del nodo guarda la prosa
// completa, asi que recortamos el titulo a pocas palabras.
function buildSceneIndex(node: any): any {
  if (!node) return null;
  const out: Record<string, any> = {
    id: node.id,
    titulo: clamp(node.name, 90),
  };
  if (node.excludeFromContext) out.bloqueado = true;
  if (node.fantasyDate) out.fecha = node.fantasyDate;
  if (node.tags && node.tags.length) out.tags = node.tags;
  const hijos = (node.children || []).map(buildSceneIndex).filter(Boolean);
  if (hijos.length) out.hijos = hijos;
  return out;
}

const onlyActive = <T extends { active?: boolean }>(list: T[] | undefined): T[] =>
  (list || []).filter((x) => x.active !== false);

const noData = {
  content: [
    {
      type: "text" as const,
      text: "Aun no hay datos. Abre la app web (npm run dev -> http://localhost:3000), edita tu narrativa y espera a que guarde (genera projectData.json).",
    },
  ],
};

const textResult = (text: string) => ({ content: [{ type: "text" as const, text }] });

// --- Fabrica del servidor MCP ------------------------------------------------
function createMcpServer(): McpServer {
  const mcp = new McpServer({ name: "TejedoraNarrativaMCP", version: "2.0.0" });

  // 1) VISTA GENERAL: punto de entrada recomendado. Resumen ligero.
  mcp.tool(
    "get_story_overview",
    "Vista general LIGERA del proyecto narrativo: nombre, arcos, arbol-resumen de la historia (solo nombres de escenas, respeta nodos bloqueados), conteos y lista de personajes. Empieza SIEMPRE por aqui; luego usa las herramientas especificas para profundizar.",
    {},
    async () => {
      const d = await loadData();
      if (!d) return noData;
      const arcs = (d.storyArcs || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        significance: a.significance,
        summary: clamp(a.summary, 400),
        esActivo: a.id === d.activeArcId,
      }));
      const overview = {
        projectName: d.projectName ?? "(sin nombre)",
        activeArcId: d.activeArcId,
        arcos: arcs,
        conteos: {
          arcos: (d.storyArcs || []).length,
          personajes: (d.characters || []).length,
          escenarios: (d.scenarios || []).length,
          loreEntries: (d.loreEntries || []).length,
          reglas: (d.worldLogicRules || []).length,
          especies: (d.species || []).length,
          objetos: (d.worldObjects || []).length,
          naciones: (d.nations || []).length,
          secretos: (d.secrets || []).length,
        },
        personajes: onlyActive(d.characters).map((c: any) => c.name),
        indiceDeEscenas: (d.storyArcs || []).map((a: any) => ({
          arco: a.name,
          arcId: a.id,
          raiz: buildSceneIndex(a.rootNode),
        })),
      };
      return textResult(
        withSizeGuard(
          pretty(overview),
          "Usa get_scene(nodeId) con los ids del indiceDeEscenas para leer cada escena."
        )
      );
    }
  );

  // 2) LISTA DE PERSONAJES: compacta.
  mcp.tool(
    "list_characters",
    "Lista compacta de personajes (nombre, arquetipo, motivacion, alias). Sin imagenes. Por defecto solo los activos.",
    { soloActivos: z.boolean().optional().describe("Si true (por defecto), solo personajes activos.") },
    async ({ soloActivos = true }) => {
      const d = await loadData();
      if (!d) return noData;
      const chars = soloActivos ? onlyActive(d.characters) : d.characters || [];
      const list = chars.map((c: any) => ({
        id: c.id,
        name: c.name,
        aliases: c.aliases,
        archetype: c.archetype,
        mainMotivation: clamp(c.mainMotivation, 300),
        active: c.active,
      }));
      return textResult(withSizeGuard(pretty(list), "Pide un personaje concreto con get_character."));
    }
  );

  // 3) UN PERSONAJE COMPLETO: sin imagenes.
  mcp.tool(
    "get_character",
    "Ficha completa de UN personaje por nombre (o id), SIN imagenes (avatar/expresiones se omiten). Incluye personalidad, backstory, voz, relaciones, memorias, evolucion, inventario, etc.",
    { nombre: z.string().describe("Nombre, alias o id del personaje.") },
    async ({ nombre }) => {
      const d = await loadData();
      if (!d) return noData;
      const q = nombre.toLowerCase().trim();
      const chars = d.characters || [];
      const found =
        chars.find((c: any) => c.id === nombre) ||
        chars.find((c: any) => c.name?.toLowerCase() === q) ||
        chars.find((c: any) => c.name?.toLowerCase().includes(q)) ||
        chars.find((c: any) => (c.aliases || []).some((a: string) => a.toLowerCase() === q));
      if (!found) {
        const names = chars.map((c: any) => c.name).join(", ");
        return textResult(`No encontre el personaje "${nombre}". Personajes disponibles: ${names}`);
      }
      return textResult(withSizeGuard(pretty(stripImages(found)), "Personaje muy extenso."));
    }
  );

  // 4) BIBLIA DEL MUNDO: lore, reglas, escenarios, etc. (solo activos, texto).
  mcp.tool(
    "get_world_bible",
    "Biblia del mundo: escenarios, reglas de logica, sistemas de magia, objetos, especies, naciones, lore y secretos (solo activos, texto sin imagenes). Descripciones recortadas si son muy largas.",
    {},
    async () => {
      const d = await loadData();
      if (!d) return noData;
      const compact = (list: any[] | undefined) =>
        onlyActive(list).map((x: any) => ({
          name: x.name,
          aliases: x.aliases,
          description: clamp(x.description ?? x.content, 1500),
        }));
      const bible = {
        escenarios: compact(d.scenarios),
        reglasDeLogica: compact(d.worldLogicRules),
        sistemasDeMagia: compact(d.magicSystems),
        objetos: compact(d.worldObjects),
        especies: compact(d.species),
        naciones: onlyActive(d.nations).map((n: any) => ({ name: n.name, description: clamp(n.description, 1500) })),
        lore: onlyActive(d.loreEntries).map((l: any) => ({ name: l.name ?? l.title, content: clamp(l.content ?? l.description, 1500) })),
        secretos: onlyActive(d.secrets).map((s: any) => ({ name: s.name, status: s.status, content: clamp(s.content, 800) })),
      };
      return textResult(
        withSizeGuard(pretty(bible), "Demasiado mundo activo. Desactiva entidades que no uses o pide categorias concretas.")
      );
    }
  );

  // 4b) UN ARCO: el "expediente" / summary completo de un arco por id.
  mcp.tool(
    "get_arc",
    "Devuelve el expediente/summary COMPLETO de un arco narrativo por su id (el texto largo que escribiste para ese arco). Los ids salen de get_story_overview.",
    { arcId: z.string().describe("El id del arco.") },
    async ({ arcId }) => {
      const d = await loadData();
      if (!d) return noData;
      const arc = (d.storyArcs || []).find((a: any) => a.id === arcId);
      if (!arc) return textResult(`No encontre ningun arco con id "${arcId}".`);
      const out = {
        id: arc.id,
        name: arc.name,
        significance: arc.significance,
        esActivo: arc.id === d.activeArcId,
        summary: arc.summary ?? "(este arco no tiene expediente/summary escrito)",
        rootNodeId: arc.rootNode?.id,
      };
      return textResult(withSizeGuard(pretty(out), "Expediente muy extenso."));
    }
  );

  // 5) UNA ESCENA: texto completo de un nodo por id.
  mcp.tool(
    "get_scene",
    "Texto/contenido completo de UNA escena (nodo) por su id, sin imagenes. Incluye bloques, nota, fecha, tags, personajes en escena y chat del director.",
    { nodeId: z.string().describe("El id del nodo/escena.") },
    async ({ nodeId }) => {
      const d = await loadData();
      if (!d) return noData;
      const node = findNode(d.storyArcs || [], nodeId);
      if (!node) return textResult(`No encontre ninguna escena con id "${nodeId}".`);
      const { children, ...rest } = node;
      const scene = {
        ...stripImages(rest),
        numHijos: (children || []).length,
        idsHijos: (children || []).map((c: any) => ({ id: c.id, name: c.name })),
      };
      return textResult(withSizeGuard(pretty(scene), "Escena muy extensa."));
    }
  );

  return mcp;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const httpServer = createServer(app);

  app.use(cors({ origin: true, credentials: true }));
  app.options("*all", cors({ origin: true, credentials: true }) as any);
  app.use(express.json({ limit: "50mb" }));

  // --- ENDPOINT MCP (Streamable HTTP) ----------------------------------------
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

  app.get("/mcp", (_req, res) => {
    res.status(405).json({
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
      await fs.writeFile(DATA_PATH(), JSON.stringify(req.body, null, 2));
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
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`MCP endpoint:    http://localhost:${PORT}/mcp`);
  });
}

startServer();
