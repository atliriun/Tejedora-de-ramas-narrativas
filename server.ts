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

// --- Bandeja de entrada de Claude (escritura) ----------------------------------
// Claude (via MCP) deja aqui "ordenes" de escritura. La app web la consulta cada
// pocos segundos, aplica los cambios a su estado React (que es la fuente de
// verdad) y confirma (ack). Asi Claude nunca pisa el guardado de la app.
const INBOX_PATH = () => path.join(process.cwd(), "claudeInbox.json");

interface InboxItem {
  id: string;
  type: "respuesta_director" | "nueva_escena" | "expediente_arco";
  payload: Record<string, any>;
  createdAt: number;
}

async function readInbox(): Promise<InboxItem[]> {
  try {
    const raw = await fs.readFile(INBOX_PATH(), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function writeInbox(items: InboxItem[]): Promise<void> {
  await fs.writeFile(INBOX_PATH(), JSON.stringify({ items }, null, 2));
}

async function queueInboxItem(type: InboxItem["type"], payload: Record<string, any>): Promise<string> {
  const items = await readInbox();
  const id = `cin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  items.push({ id, type, payload, createdAt: Date.now() });
  await writeInbox(items);
  return id;
}

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
      // Sacamos los chats del volcado: pueden ser enormes y desbordar la escena.
      // Se leen aparte con leer_chat_director / leer_chat_cowriter.
      const { children, directorChatHistory, chatHistory, ...rest } = node;
      const lastOf = (arr: any[]) =>
        arr && arr.length ? clamp(arr[arr.length - 1]?.text, 300) : undefined;
      const scene = {
        ...stripImages(rest),
        chatDelDirector: {
          numMensajes: (directorChatHistory || []).length,
          ultimoMensaje: lastOf(directorChatHistory),
          nota: (directorChatHistory || []).length
            ? "Usa leer_chat_director(nodeId) para leer la conversacion completa."
            : undefined,
        },
        chatCoWriter: {
          numMensajes: (chatHistory || []).length,
          ultimoMensaje: lastOf(chatHistory),
          nota: (chatHistory || []).length
            ? "Usa leer_chat_cowriter(nodeId) para leer la conversacion completa."
            : undefined,
        },
        numHijos: (children || []).length,
        idsHijos: (children || []).map((c: any) => ({ id: c.id, name: c.name })),
      };
      return textResult(withSizeGuard(pretty(scene), "Escena muy extensa."));
    }
  );

  // 5b) LEER CHATS DE UN NODO (paginado). El director chat puede pesar >100KB,
  // asi que se lee por tramos. Por defecto devuelve los mensajes mas recientes.
  const makeChatReader = (
    toolName: string,
    field: "directorChatHistory" | "chatHistory",
    etiqueta: string
  ) =>
    mcp.tool(
      toolName,
      `Lee el ${etiqueta} de una escena (nodo), paginado. Por defecto devuelve los ultimos mensajes (los mas recientes). Usa 'desde' para paginar hacia atras. Cada mensaje trae su indice para poder pedir mas contexto.`,
      {
        nodeId: z.string().describe("El id del nodo/escena."),
        cantidad: z.number().int().positive().max(40).optional().describe("Cuantos mensajes traer (por defecto 15)."),
        desde: z.number().int().min(0).optional().describe("Indice inicial (0 = el mas antiguo). Si se omite, trae los ultimos 'cantidad'."),
      },
      async ({ nodeId, cantidad = 15, desde }: { nodeId: string; cantidad?: number; desde?: number }) => {
        const d = await loadData();
        if (!d) return noData;
        const node = findNode(d.storyArcs || [], nodeId);
        if (!node) return textResult(`No encontre ninguna escena con id "${nodeId}".`);
        const hist: any[] = (node as any)[field] || [];
        const total = hist.length;
        if (total === 0) return textResult(`La escena "${clamp(node.name, 60)}" no tiene ${etiqueta} todavia.`);
        const start = desde === undefined ? Math.max(0, total - cantidad) : Math.min(desde, total);
        const slice = hist.slice(start, start + cantidad).map((m: any, i: number) => ({
          indice: start + i,
          role: m.role,
          text: clamp(m.text, 6000),
        }));
        const out = {
          nodeId,
          escena: clamp(node.name, 60),
          totalMensajes: total,
          mostrando: `${start}..${start + slice.length - 1}`,
          hayMasAntiguos: start > 0,
          hayMasRecientes: start + slice.length < total,
          mensajes: slice,
        };
        return textResult(withSizeGuard(pretty(out), "Pide menos 'cantidad' o usa 'desde' para paginar."));
      }
    );

  makeChatReader("leer_chat_director", "directorChatHistory", "chat del modo director");
  makeChatReader("leer_chat_cowriter", "chatHistory", "chat del co-escritor");

  // ============ HERRAMIENTAS DE ESCRITURA (via bandeja de entrada) ============
  // Estas herramientas NO modifican projectData.json directamente (la app web es
  // la fuente de verdad y lo sobreescribiria). Encolan el cambio en una bandeja
  // que la app aplica en vivo. La app debe estar ABIERTA para que se apliquen.

  // 6) RESPONDER EN MODO DIRECTOR: el corazon del flujo con la suscripcion.
  mcp.tool(
    "responder_modo_director",
    "Envia tu respuesta como Director Narrativo al chat del modo director de una escena (nodo) de la app. La respuesta aparece en vivo en la app si esta abierta. Usa get_story_overview / get_scene primero para conocer el contexto y el nodeId correcto. Escribe la respuesta completa y en espanol, con el estilo narrativo del proyecto.",
    {
      nodeId: z.string().describe("El id del nodo/escena donde responder (sale de get_story_overview o buscar)."),
      texto: z.string().min(1).describe("Tu respuesta completa como director narrativo."),
    },
    async ({ nodeId, texto }) => {
      const d = await loadData();
      if (!d) return noData;
      const node = findNode(d.storyArcs || [], nodeId);
      if (!node) return textResult(`No existe ningun nodo con id "${nodeId}". Usa get_story_overview para ver los ids validos.`);
      await queueInboxItem("respuesta_director", { nodeId, texto });
      return textResult(
        `Respuesta encolada para la escena "${clamp(node.name, 60)}". Aparecera en el chat del modo director de la app en unos segundos (la app debe estar abierta en el navegador).`
      );
    }
  );

  // 7) CREAR ESCENA: anade un nodo hijo con la prosa generada.
  mcp.tool(
    "crear_escena",
    "Crea una NUEVA escena (nodo hijo) bajo una escena existente, con el texto narrativo que tu generes. En esta app el texto de la escena vive en el nombre del nodo. Usala cuando el usuario te pida continuar la historia con una escena nueva.",
    {
      parentNodeId: z.string().describe("El id del nodo padre bajo el que se crea la escena."),
      texto: z.string().min(1).describe("El texto narrativo completo de la nueva escena."),
    },
    async ({ parentNodeId, texto }) => {
      const d = await loadData();
      if (!d) return noData;
      const parent = findNode(d.storyArcs || [], parentNodeId);
      if (!parent) return textResult(`No existe ningun nodo con id "${parentNodeId}".`);
      await queueInboxItem("nueva_escena", { parentNodeId, texto });
      return textResult(
        `Nueva escena encolada bajo "${clamp(parent.name, 60)}". Aparecera en el arbol de la app en unos segundos (la app debe estar abierta).`
      );
    }
  );

  // 8) EXPEDIENTE DE ARCO: escribe/actualiza el summary largo de un arco.
  mcp.tool(
    "escribir_expediente_arco",
    "Escribe o reemplaza el expediente/summary completo de un arco narrativo (el documento largo de notas del arco). Util cuando el usuario te pide compilar el expediente del arco. CUIDADO: reemplaza el expediente anterior; usa get_arc primero si necesitas conservar contenido.",
    {
      arcId: z.string().describe("El id del arco (sale de get_story_overview)."),
      expediente: z.string().min(1).describe("El texto completo del expediente del arco."),
    },
    async ({ arcId, expediente }) => {
      const d = await loadData();
      if (!d) return noData;
      const arc = (d.storyArcs || []).find((a: any) => a.id === arcId);
      if (!arc) return textResult(`No existe ningun arco con id "${arcId}".`);
      await queueInboxItem("expediente_arco", { arcId, expediente });
      return textResult(`Expediente encolado para el arco "${arc.name}". Se aplicara en la app en unos segundos (la app debe estar abierta).`);
    }
  );

  // 9) BUSCAR: localizar nodos/personajes/lore por texto sin leerlo todo.
  mcp.tool(
    "buscar",
    "Busca un texto (nombre de personaje, lugar, frase) en las escenas, personajes y lore del proyecto. Devuelve ids y fragmentos. Util para localizar el nodeId correcto antes de responder_modo_director o get_scene.",
    { texto: z.string().min(2).describe("Texto a buscar (insensible a mayusculas).") },
    async ({ texto }) => {
      const d = await loadData();
      if (!d) return noData;
      const q = texto.toLowerCase();
      const hits: any[] = [];
      const scanNode = (node: any, arcName: string) => {
        if (!node) return;
        const name: string = node.name || "";
        const idx = name.toLowerCase().indexOf(q);
        if (idx >= 0) {
          hits.push({
            tipo: "escena",
            arco: arcName,
            nodeId: node.id,
            fragmento: clamp(name.slice(Math.max(0, idx - 80), idx + 160), 260),
            bloqueado: node.excludeFromContext || undefined,
          });
        }
        (node.children || []).forEach((c: any) => scanNode(c, arcName));
      };
      for (const arc of d.storyArcs || []) scanNode(arc.rootNode, arc.name);
      for (const c of d.characters || []) {
        const hay = [c.name, ...(c.aliases || [])].some((s: string) => s?.toLowerCase().includes(q));
        if (hay) hits.push({ tipo: "personaje", id: c.id, name: c.name });
      }
      for (const l of d.loreEntries || []) {
        const content = `${l.name ?? l.title ?? ""} ${l.content ?? l.description ?? ""}`;
        if (content.toLowerCase().includes(q)) hits.push({ tipo: "lore", id: l.id, name: l.name ?? l.title });
      }
      if (!hits.length) return textResult(`Sin resultados para "${texto}".`);
      return textResult(withSizeGuard(pretty(hits.slice(0, 50)), "Demasiados resultados; afina la busqueda."));
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

  // Bandeja de entrada de Claude: la app la consulta y confirma lo aplicado.
  app.get("/api/claude/inbox", async (_req, res) => {
    res.json({ items: await readInbox() });
  });

  app.post("/api/claude/inbox/ack", async (req, res) => {
    try {
      const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const items = await readInbox();
      await writeInbox(items.filter((i) => !ids.includes(i.id)));
      res.json({ success: true });
    } catch (e) {
      console.error("Error en ack del inbox:", e);
      res.status(500).json({ error: "Failed to ack inbox items" });
    }
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
