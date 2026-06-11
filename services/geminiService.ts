
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
// Added missing imports: PsychologicalTrait, WorldRule
import { ChatMessage, SafetySettings, Character, Scenario, TagGroup, MagicSystem, WorldObject, Species, NarrativeGoal, StoryFlag, Tag, LoreEntry, AiRoleType, PsychologicalTrait, WorldRule } from '../types';
import { filterContextByKeywords } from '../utils/contextUtils';
import * as Prompts from '../utils/ai/prompts';
import * as Schemas from '../utils/ai/schemas';
import { DIRECTOR_TOOLS } from "../constants";

// --- CENTRALIZED HELPER ---

const callGemini = async (
    modelName: string,
    prompt: string | any[],
    systemInstruction: string | undefined,
    temperature: number,
    safetySettings: SafetySettings,
    responseSchema?: any,
    useTools: boolean = false,
    signal?: AbortSignal
) => {
    if (!process.env.API_KEY) throw new Error("API_KEY environment variable is not set");
    
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const safetyConfig = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: getSafetyThreshold(safetySettings.harassment) },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: getSafetyThreshold(safetySettings.hateSpeech) },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: getSafetyThreshold(safetySettings.sexuallyExplicit) },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: getSafetyThreshold(safetySettings.dangerousContent) },
    ];

    const config: any = {
        temperature,
        safetySettings: safetyConfig,
    };

    if (responseSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = responseSchema;
    }
    
    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    if (useTools) {
        config.tools = [{ googleSearch: {} }];
    }

    try {
        // Fix: remove second argument { signal } as generateContent only expects one argument according to SDK rules
        const response = await client.models.generateContent({
            model: modelName,
            contents: prompt,
            config
        }); 

        // Check for prompt blocking
        // @ts-ignore
        if (response.promptFeedback && response.promptFeedback.blockReason) {
             // @ts-ignore
             return `⚠️ BLOQUEO DE ENTRADA (Prompt): El texto que enviaste activó los filtros de seguridad de Google (${response.promptFeedback.blockReason}). Intenta reformular la escena.`;
        }

        if (!response.candidates || response.candidates.length === 0) {
             return "⚠️ Error: La IA no devolvió ningún candidato. (Posible bloqueo silencioso o error 500).";
        }

        const candidate = response.candidates[0];
        let text = "";
        try { text = response.text || ""; } catch(e) {}
        if (!text && candidate.content?.parts) {
            text = candidate.content.parts.map((p: any) => p.text || "").join("");
        }

        if (candidate.finishReason) {
            switch (candidate.finishReason) {
                case 'SAFETY':
                case 'RECITATION':
                case 'OTHER':
                    const msgBlock = `\n\n⚠️ SILENCIO DE IA (BLOQUEO SUAVE): La IA se negó a responder para este prompt (probablemente un filtro interno silencioso). Intenta reformular.`;
                    return text ? text + msgBlock : msgBlock.trim();
                case 'MAX_TOKENS':
                    return text + "\n\n⚠️ [RESPUESTA TRUNCADA]: Se alcanzó el límite de tokens del modelo. Intenta ser más específico o dividir la petición.";
                case 'STOP':
                    break; 
                default:
                    console.warn("Unknown finish reason:", candidate.finishReason);
            }
        }

        // Critical Fix for "Silent Refusal" (Empty Text with STOP reason)
        if (!text && (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0)) {
             return "⚠️ SILENCIO DE IA (BLOQUEO SUAVE): La IA se negó a responder para este prompt (probablemente un filtro interno silencioso). Intenta reformular.";
        }
        
        if (useTools && candidate.groundingMetadata?.groundingChunks) {
            // @ts-ignore
            const chunks = candidate.groundingMetadata.groundingChunks;
            const links = chunks
                // @ts-ignore
                .filter(c => c.web?.uri && c.web?.title)
                // @ts-ignore
                .map(c => `[${c.web.title}](${c.web.uri})`);
            
            if (links.length > 0) {
                text += `\n\n**Fuentes:**\n${[...new Set(links)].join('\n')}`;
            }
        }

        if (!text) return "⚠️ Error: Respuesta vacía (Texto nulo).";

        return text;

    } catch (error: any) {
        if (error.name === 'AbortError') throw error; 

        console.error("Gemini API Error Details:", error);
        
        if (error.message?.includes("400")) return "Error 400 (Bad Request): Solicitud inválida.";
        
        // Manejo específico para el error 429 (Límites)
        if (error.message?.includes("429") || error.message?.includes("Resource has been exhausted")) {
             // Diferenciar entre cuota diaria y límite de velocidad (RPM)
             if (error.message?.includes("Quota") || error.message?.includes("quota")) {
                 return "⚠️ Error 429 (Cuota Diaria): Has agotado tus mensajes gratuitos por hoy. Se reinicia a medianoche (PT).";
             }
             
             // Si es límite de velocidad (RPM), calculamos +1 minuto desde ahora
             const nextTry = new Date(Date.now() + 60 * 1000);
             const timeString = nextTry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
             return `⚠️ Error 429 (Límite de Velocidad): Demasiados mensajes. Podrás enviar el siguiente aprox. a las: **${timeString}**`;
        }

        if (error.message?.includes("500") || error.message?.includes("503")) return "Error 5xx: Problema en los servidores de Google.";

        return `Error de sistema: ${error.message || "Desconocido"}`;
    }
};

const getSafetyThreshold = (level: number) => {
    const map: Record<number, HarmBlockThreshold> = {
        0: HarmBlockThreshold.BLOCK_NONE,
        1: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        2: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        3: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    };
    return map[level] ?? HarmBlockThreshold.BLOCK_NONE;
};

// --- PUBLIC METHODS ---

export const generateBranches = async (
    storyPath: string, branchType: string, model: string, temperature: number, safety: SafetySettings, 
    traits: PsychologicalTrait[], rules: WorldRule[], scenarios: Scenario[], tags: { groupName: string; tag: Tag }[], activeChars: Character[] = [],
    useSearch: boolean = false,
    signal?: AbortSignal
): Promise<{ name: string }[]> => {
    try {
        const prompt = Prompts.getBranchGenerationPrompt(storyPath, branchType, traits, rules, scenarios, tags, activeChars);
        const jsonText = await callGemini(model, prompt, undefined, temperature, safety, Schemas.branchesResponseSchema, useSearch, signal);
        if (jsonText.startsWith('⚠️') || jsonText.startsWith('Error')) return [{ name: jsonText }];
        
        try {
            const data = JSON.parse(jsonText || '[]');
            return Array.isArray(data) ? data : [];
        } catch (parseError) {
            console.error("JSON Parse Error in generateBranches:", parseError, jsonText);
            return [{ name: "Error: La IA devolvió un formato inválido." }];
        }
    } catch (e: any) { 
        if (e.name === 'AbortError') throw e;
        return [{ name: "Error generating branches." }]; 
    }
};

export const regenerateBranch = async (
    storyPath: string, currentText: string, model: string, temperature: number, safety: SafetySettings,
    traits: PsychologicalTrait[], rules: WorldRule[], scenarios: Scenario[], tags: { groupName: string; tag: Tag }[], activeChars: Character[] = [],
    useSearch: boolean = false,
    signal?: AbortSignal
): Promise<{ name: string }> => {
    try {
        const prompt = Prompts.getRegenerateBranchPrompt(storyPath, currentText, traits, rules, scenarios, tags, activeChars);
        const jsonText = await callGemini(model, prompt, undefined, temperature, safety, Schemas.singleBranchResponseSchema, useSearch, signal);
        if (jsonText.startsWith('⚠️') || jsonText.startsWith('Error')) return { name: jsonText };
        
        try {
            return JSON.parse(jsonText || '{}') || { name: "Error." };
        } catch (parseError) {
            console.error("JSON Parse Error in regenerateBranch:", parseError, jsonText);
            return { name: "Error: Formato inválido." };
        }
    } catch (e: any) { 
        if (e.name === 'AbortError') throw e;
        return { name: "Error regenerating." }; 
    }
};

export const directorChat = async (
    chatHistory: ChatMessage[], userMessage: string, narrativeHistory: any[], characters: Character[], scenarios: Scenario[], 
    tagGroups: TagGroup[], magic: MagicSystem[], objects: WorldObject[], species: Species[], model: string, temperature: number, safety: SafetySettings,
    traits: PsychologicalTrait[], rules: WorldRule[], summary: string, goals: NarrativeGoal[], flags: StoryFlag[], 
    context: { fantasyDate: string; activeCharacterIds: string[]; activeScenarioIds: string[]; activeTagIds: string[]; nodeTags: string[]; aiRole?: AiRoleType; aiCustomInstruction?: string; },
    useSearch: boolean = false,
    isSystemMode: boolean = false,
    externalContext: string = "",
    signal?: AbortSignal,
    previousModelContent?: any,
    toolResponses?: any[],
    onChunk?: (text: string) => void
): Promise<{ text: string; toolCalls?: any[]; modelContent?: any }> => {
    try {
        const historyToUse = narrativeHistory.slice(-15);
        const contextText = userMessage + " " + historyToUse.map((n: any) => n.text).join(" ");
        const activeChars = characters.filter(c => context.activeCharacterIds.includes(c.id));
        const activeScens = scenarios.filter(s => context.activeScenarioIds.includes(s.id));
        const activeTags: { groupName: string; tag: Tag }[] = [];
        for (const tagId of (context.activeTagIds || [])) {
            for (const group of tagGroups) {
                const tag = group.tags.find(t => t.id === tagId);
                if (tag) { activeTags.push({ groupName: group.name, tag }); break; }
            }
        }
        const relevantMagic = filterContextByKeywords(contextText, magic);
        const relevantObjects = filterContextByKeywords(contextText, objects);
        const relevantSpecies = filterContextByKeywords(contextText, species);
        const relevantLore: LoreEntry[] = []; 

        const systemInstruction = Prompts.getDirectorChatSystemInstruction(
            historyToUse, traits, rules, activeChars, activeScens, activeTags, context.nodeTags,
            relevantMagic, relevantObjects, relevantSpecies, relevantLore, summary, goals, flags, context.fantasyDate,
            isSystemMode,
            externalContext,
            context.aiRole || 'co-writer', 
            context.aiCustomInstruction || '' 
        );

        const validHistory = chatHistory
            .filter(msg => msg.text && msg.text.trim().length > 0)
            .map(msg => ({ 
                // Gemini supports user and model roles. System messages are established by instructing Gemini
                // that role 'user' might also contain system injections, or mapping them to model if they are facts.
                // However, the best way is to map system manually to user but with a tag [SYSTEM DATA].
                role: msg.role === 'system' ? 'user' : msg.role, 
                parts: [{ text: msg.role === 'system' ? `[ESTABLISHED DATA]: ${msg.text.trim()}` : msg.text.trim() }] 
            }));

        const contents: any[] = [...validHistory];
        if (userMessage && userMessage.trim().length > 0) {
            contents.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
        }

        if (previousModelContent && toolResponses && toolResponses.length > 0) {
            contents.push(previousModelContent);
            contents.push({
                role: 'user',
                parts: toolResponses.map(res => ({ functionResponse: res }))
            });
        }

        if (!process.env.API_KEY) throw new Error("API_KEY not set");
        const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const tools: any[] = [];
        let toolConfig: any = undefined;

        tools.push({ functionDeclarations: DIRECTOR_TOOLS });
        
        if (useSearch) {
            tools.push({ googleSearch: {} });
            toolConfig = { includeServerSideToolInvocations: true };
        }

        const safetyConfig = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: getSafetyThreshold(safety.harassment) },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: getSafetyThreshold(safety.hateSpeech) },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: getSafetyThreshold(safety.sexuallyExplicit) },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: getSafetyThreshold(safety.dangerousContent) },
        ];

        let finalResponse: any = null;
        let cumulativeText = "";
        let toolCalls: any[] = [];
        let finalCandidate: any = null;

        try {
            if (onChunk) {
                const responseStream = await client.models.generateContentStream({
                    model: model,
                    contents: contents,
                    config: {
                        temperature,
                        safetySettings: safetyConfig,
                        systemInstruction,
                        tools: tools,
                        ...(toolConfig ? { toolConfig } : {})
                    }
                });
                
                let promptFeedback: any = null;
                for await (const chunk of responseStream) {
                    if (signal?.aborted) throw new Error("AbortError");
                    if (chunk.promptFeedback) promptFeedback = chunk.promptFeedback;
                    
                    let chunkText = "";
                    if (chunk.candidates?.[0]?.content?.parts) {
                        chunkText = chunk.candidates[0].content.parts.filter((p: any) => p.text).map((p: any) => p.text).join("");
                    }

                    if (chunkText) {
                        cumulativeText += chunkText;
                        onChunk(cumulativeText);
                    }
                    if (chunk.functionCalls) {
                        toolCalls.push(...chunk.functionCalls);
                    }
                    if (chunk.candidates && chunk.candidates.length > 0) {
                        finalCandidate = chunk.candidates[0]; // will represent the last candidate state
                    }
                }
                finalResponse = { text: () => cumulativeText, candidates: [finalCandidate], functionCalls: toolCalls, promptFeedback };
            } else {
                finalResponse = await client.models.generateContent({
                    model: model,
                    contents: contents,
                    config: {
                        temperature,
                        safetySettings: safetyConfig,
                        systemInstruction,
                        tools: tools,
                        ...(toolConfig ? { toolConfig } : {})
                    }
                });
            }
        } catch(apiError: any) {
             if (apiError.name === 'AbortError') throw apiError;
             
             let errorMessage = `⚠️ Error de API: ${apiError.message || "Desconocido"}`;
             
             if (apiError.message?.includes("429") || apiError.message?.includes("Resource has been exhausted")) {
                 const nextTry = new Date(Date.now() + 60 * 1000);
                 const timeString = nextTry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                 errorMessage = `⚠️ Error 429 (Límite de Velocidad): Demasiados mensajes. Podrás enviar el siguiente aprox. a las: **${timeString}**`;
             } else if (apiError.message?.includes("fetch failed") || apiError.message?.includes("network") || apiError.message?.includes("WebSocket") || apiError.message?.toLowerCase().includes("finish reason") || apiError.message?.toLowerCase().includes("safety") || apiError.message?.toLowerCase().includes("aborted")) {
                  // Lots of random stream cuts from Google throw opaque connection errors, handle them explicitly as soft blocks if there's cumulative text, 
                  // or append the soft block message since we aren't sure why it was cut.
                  errorMessage = `⚠️ INTERRUPCIÓN DE RED O BLOQUEO DE IA: La IA se detuvo o rechazó responder (Error: ${apiError.message}). Intenta reformular.`;
             }

             if (cumulativeText) {
                 return { text: cumulativeText + `\n\n${errorMessage}`, toolCalls };
             }

             return { text: errorMessage, toolCalls: [] };
        }

        if (!finalResponse) return { text: "⚠️ Error: Respuesta nula.", toolCalls: [] };

        // @ts-ignore
        if (finalResponse.promptFeedback && finalResponse.promptFeedback.blockReason) {
             // @ts-ignore
             return { text: `⚠️ SILENCIO DE IA (BLOQUEO SUAVE): La IA se negó a responder para este prompt (probablemente un filtro interno silencioso). Intenta reformular. (Razón: ${finalResponse.promptFeedback.blockReason}).`, toolCalls: [] };
        }

        if (!finalResponse.candidates || finalResponse.candidates.length === 0) {
             return { text: "⚠️ SILENCIO DE IA (BLOQUEO SUAVE): La IA se negó a responder para este prompt (probablemente un filtro interno silencioso). Intenta reformular.", toolCalls: [] };
        }

        const candidate = finalResponse.candidates[0];
        
        let text = "";
        try { 
            // Avoid calling finalResponse.text if we know there are functionCalls to prevent SDK warnings
            if (finalResponse.functionCalls && finalResponse.functionCalls.length > 0) {
                text = finalResponse.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("") || "";
            } else {
                text = (typeof finalResponse.text === 'function' ? finalResponse.text() : finalResponse.text) || finalResponse.candidates?.[0]?.content?.parts?.map((p:any)=>p.text||"").join("") || ""; 
            }
        } catch(e) {}
        if (!text && candidate.content?.parts) {
            text = candidate.content.parts.map((p: any) => p.text || "").join("");
        }

        if (candidate.finishReason) {
            switch (candidate.finishReason) {
                case 'SAFETY':
                case 'RECITATION':
                case 'OTHER':
                    text += `\n\n⚠️ SILENCIO DE IA (BLOQUEO SUAVE): La IA se negó a responder para este prompt (probablemente un filtro interno silencioso). Intenta reformular.`;
                    break;
                case 'MAX_TOKENS':
                    text += `\n\n⚠️ [RESPUESTA TRUNCADA]: Límite de tokens alcanzado.`;
                    break;
            }
        }
        text = text.trim();
        
        // Critical Check for Director Mode as well
        if (!text && (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0)) {
             text = "⚠️ SILENCIO DE IA (BLOQUEO SUAVE): La IA se negó a responder para este prompt (probablemente un filtro interno silencioso). Intenta reformular.";
        }

        const toolCallsResponse = finalResponse.functionCalls || [];

        if (!text && toolCallsResponse.length === 0) {
            return { text: "⚠️ Error: Respuesta vacía.", toolCalls: [] };
        }

        if (useSearch && candidate.groundingMetadata?.groundingChunks) {
            // @ts-ignore
            const chunks = candidate.groundingMetadata.groundingChunks;
            const links = chunks.filter(c => c.web?.uri && c.web?.title).map(c => `[${c.web.title}](${c.web.uri})`);
            if (links.length > 0) return { text: text + `\n\n**Fuentes:**\n${[...new Set(links)].join('\n')}`, toolCalls: toolCallsResponse, modelContent: candidate.content };
        }

        return { text: text || (toolCallsResponse.length > 0 ? "Ejecutando acciones..." : "Error."), toolCalls: toolCallsResponse, modelContent: candidate.content };

    } catch (e: any) {
        if (e.name === 'AbortError') throw e;
        return { text: `Error: ${e.message}`, toolCalls: [] }; 
    }
};

export const continuePlot = async (
    narrativeHistory: any[], characters: Character[], scenarios: Scenario[], magic: MagicSystem[], objects: WorldObject[], species: Species[],
    model: string, temperature: number, safety: SafetySettings, traits: PsychologicalTrait[], rules: WorldRule[], summary: string, goals: NarrativeGoal[], flags: StoryFlag[], guidance?: string,
    useSearch: boolean = false,
    signal?: AbortSignal
): Promise<{ summary: string, details: string } | null> => {
    try {
        const historyText = narrativeHistory.map(n => n.text + ' ' + (n.note || '')).join(' ');
        const contextToScan = `${historyText} ${guidance || ''}`;
        const relevantLore: LoreEntry[] = []; 

        const prompt = Prompts.getContinuePlotPrompt(
            narrativeHistory, traits, rules, characters, scenarios, 
            filterContextByKeywords(contextToScan, magic), 
            filterContextByKeywords(contextToScan, objects), 
            filterContextByKeywords(contextToScan, species), 
            relevantLore,
            summary, goals, flags, guidance
        );
        const jsonText = await callGemini(model, prompt, undefined, temperature, safety, Schemas.plotContinuationResponseSchema, useSearch, signal);
        if (jsonText.startsWith('⚠️') || jsonText.startsWith('Error')) return { summary: "Error", details: jsonText };
        
        try {
            return JSON.parse(jsonText || 'null');
        } catch (parseError) {
            console.error("JSON Parse Error in continuePlot:", parseError, jsonText);
            return { summary: "Error", details: "La IA devolvió un formato inválido." };
        }
    } catch (e: any) { 
        if (e.name === 'AbortError') throw e;
        return null; 
    }
};

export const continueChat = async (
    storyPath: string, chatHistory: ChatMessage[], userMessage: string, model: string, temperature: number, safety: SafetySettings,
    traits: PsychologicalTrait[], rules: WorldRule[], scenarios: Scenario[], tags: { groupName: string; tag: Tag }[], date: string, goals: NarrativeGoal[], flags: StoryFlag[], activeChars: Character[],
    useSearch: boolean = false,
    signal?: AbortSignal
): Promise<string> => {
    const systemInstruction = Prompts.getChatSystemInstruction(storyPath, traits, rules, scenarios, tags, date, goals, flags, activeChars);
    const validHistory = chatHistory.filter(msg => msg.text && msg.text.trim().length > 0).map(msg => ({ 
        role: msg.role === 'system' ? 'user' : msg.role, 
        parts: [{ text: msg.role === 'system' ? `[DATA]: ${msg.text.trim()}` : msg.text.trim() }] 
    }));
    const contents = [...validHistory];
    if (userMessage && userMessage.trim()) contents.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
    try {
        return (await callGemini(model, contents, systemInstruction, temperature, safety, undefined, useSearch, signal)) || "Error.";
    } catch (e: any) { 
        if (e.name === 'AbortError') throw e;
        return "Error."; 
    }
};

export const worldBuildingChat = async (
    chatHistory: ChatMessage[], userMessage: string, docContent: string, summary: string, model: string, temperature: number, safety: SafetySettings,
    traits: PsychologicalTrait[], rules: WorldRule[], allChars: Character[], allScenarios: Scenario[], allMagic: MagicSystem[], allObjects: WorldObject[], allSpecies: Species[], goals: NarrativeGoal[], flags: StoryFlag[],
    useSearch: boolean = false,
    signal?: AbortSignal
): Promise<string> => {
    const contextText = userMessage + " " + (chatHistory.slice(-2).map(m => m.text).join(" "));
    const relevantLore: LoreEntry[] = []; 
    const systemInstruction = Prompts.getWorldChatSystemInstruction(traits, rules, filterContextByKeywords(contextText, allChars), filterContextByKeywords(contextText, allScenarios), filterContextByKeywords(contextText, allMagic), filterContextByKeywords(contextText, allObjects), filterContextByKeywords(contextText, allSpecies), relevantLore, docContent, summary, allChars, goals, flags);
    const validHistory = chatHistory.filter(msg => msg.text && msg.text.trim().length > 0).map(msg => ({ role: msg.role, parts: [{ text: msg.text.trim() }] }));
    const contents = [...validHistory];
    if (userMessage && userMessage.trim()) contents.push({ role: 'user', parts: [{ text: userMessage.trim() }] });
    try {
        return (await callGemini(model, contents, systemInstruction, temperature, safety, undefined, useSearch, signal)) || "Error.";
    } catch (e: any) { 
        if (e.name === 'AbortError') throw e;
        return "Error."; 
    }
};

export const translateText = async (text: string, targetLanguage: string, model: string, safetySettings: SafetySettings, signal?: AbortSignal): Promise<string> => {
    try {
        return (await callGemini(model, Prompts.getTranslationPrompt(text, targetLanguage), undefined, 0.2, safetySettings, undefined, false, signal))?.trim() || "Error";
    } catch (e: any) { if (e.name === 'AbortError') throw e; return "Error"; }
};

export const correctText = async (text: string, model: string, safetySettings: SafetySettings, signal?: AbortSignal): Promise<string> => {
    try {
        let res = (await callGemini(model, Prompts.getCorrectionPrompt(text), undefined, 0.1, safetySettings, undefined, false, signal))?.trim() || text;
        if (res.startsWith('"') && res.endsWith('"')) res = res.substring(1, res.length - 1);
        return res;
    } catch (e: any) { if (e.name === 'AbortError') throw e; return text; }
};

export const generateWorldBuildingDetails = async (
    context: { name: string; description: string; type: 'Magic System' | 'World Object' | 'Scenario'; detailType: 'Rules' | 'Functions' | 'Key Features' },
    model: string, temperature: number, safetySettings: SafetySettings,
    signal?: AbortSignal
): Promise<{ text: string; description: string; }[]> => {
    try {
        const prompt = Prompts.getWorldDetailsPrompt(context);
        const jsonText = await callGemini(model, prompt, undefined, temperature, safetySettings, Schemas.worldBuildingDetailsSchema, false, signal);
        if (jsonText.startsWith('⚠️')) return [];
        
        try {
            const data = JSON.parse(jsonText || '[]');
            return Array.isArray(data) ? data : [];
        } catch (parseError) {
            console.error("JSON Parse Error in generateWorldBuildingDetails:", parseError, jsonText);
            return [];
        }
    } catch (e: any) { if (e.name === 'AbortError') throw e; return []; }
};
