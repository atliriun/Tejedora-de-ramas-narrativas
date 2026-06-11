
import { Character, Scenario, Tag, WorldRule, PsychologicalTrait, NarrativeGoal, StoryFlag, MagicSystem, WorldObject, Species, LoreEntry, Nation, Secret, CharacterState, CharacterAbility, CharacterMemory, CharacterRelationship, EvolutionMilestone, InventoryItem, Resource } from '../types';
import { TRAIT_CATEGORY_LABELS } from '../constants';

/**
 * NEW: Formats the character's inventory and resources for the AI.
 */
export const formatCharacterPossessions = (inventory: InventoryItem[] | undefined, resources: Resource[] | undefined): string => {
    let text = '';
    
    if (resources && resources.length > 0) {
        const resStr = resources.map(r => `${r.name}: ${r.current}/${r.max}`).join(', ');
        text += `\n  [SUMINISTROS/DIVISAS]: ${resStr}`;
    }

    if (inventory && inventory.length > 0) {
        const invStr = inventory.map(i => {
            let item = `${i.name} (x${i.quantity})`;
            if (i.equipped) item = `[EQUIPADO] ${item}`;
            if (i.description) item += `: ${i.description}`;
            return item;
        }).join('; ');
        text += `\n  [INVENTARIO ACTUAL]: ${invStr}`;
    }

    return text;
};

/**
 * NEW: Formats the deep evolution milestones into a structured dossier for the AI.
 */
export const formatCharacterEvolution = (evolution: EvolutionMilestone[] | undefined): string => {
    if (!evolution || evolution.length === 0) return '';
    
    const achieved = evolution.filter(m => m.achieved);
    if (achieved.length === 0) return '';

    let text = `\n  [ARCHIVOS DE EVOLUCIÓN Y CRÓNICA PASADA]:`;
    achieved.forEach(m => {
        text += `\n    --- ETAPA: "${m.name}" (${m.dateAchieved || 'Tiempo no definido'}) ---`;
        if (m.roleAtMoment) text += `\n      * Rol en esta fase: ${m.roleAtMoment}`;
        if (m.mentalState) text += `\n      * Estado Mental: ${m.mentalState}`;
        if (m.locationAtMoment) text += `\n      * Ubicación: ${m.locationAtMoment}`;
        
        if (m.description) {
            text += `\n      * HECHOS VIVIDOS: ${m.description}`;
        }
        
        if (m.privateThoughts) {
            text += `\n      * LÓGICA INTERNA (Secretos): ${m.privateThoughts}`;
        }
        
        if (m.diaryFragment) {
            text += `\n      * FRAGMENTO DE DIARIO (Su voz real): "${m.diaryFragment}"`;
        }
        
        if (m.tacticalPoints && m.tacticalPoints.length > 0) {
            text += `\n      * DATOS TÁCTICOS DESCUBIERTOS: ${m.tacticalPoints.join('; ')}`;
        }
    });

    return text;
};

export const formatSecrets = (secrets: Secret[] | undefined, allCharacters: Character[]): string => {
    if (!secrets || secrets.length === 0) return '';
    
    let text = `\n\n--- SECRETOS Y TRAMAS OCULTAS (Contexto Privilegiado) ---\n`;
    text += `IMPORTANTE: Usa esta información para generar tensión, ironía dramática o revelar misterios gradualmente. NO reveles información a personajes que NO la saben.\n`;

    secrets.forEach(secret => {
        const statusLabel = secret.status === 'revealed' ? '[REVELADO]' : secret.status === 'at_risk' ? '[EN RIESGO]' : '[OCULTO]';
        
        let knownByNames = "Nadie (Solo el Narrador)";
        if (secret.knownByCharacterIds && secret.knownByCharacterIds.length > 0) {
            const names = secret.knownByCharacterIds.map(id => {
                const char = allCharacters.find(c => c.id === id);
                return char ? char.name : 'Desconocido';
            });
            knownByNames = names.join(', ');
        }

        text += `- ${statusLabel} ${secret.name} (${secret.category || 'General'})\n`;
        text += `  VERDAD: ${secret.content}\n`;
        text += `  CONOCIDO POR: ${knownByNames}\n`;
        if (secret.consequences) text += `  RIESGO: ${secret.consequences} (Nivel ${secret.level}/5)\n`;
    });

    return text;
};

export const formatWorldContext = (
    psychologicalTraits: PsychologicalTrait[], 
    worldLogicRules: WorldRule[], 
    narrativeGoals?: NarrativeGoal[], 
    flags?: StoryFlag[],
    secrets?: Secret[], 
    allCharacters?: Character[]
): string => {
    let contextText = '';
    
    if (flags && flags.length > 0) {
        const activeFlags = flags.filter(f => f.state);
        if (activeFlags.length > 0) {
            contextText += `\n\n--- ESTADOS GLOBALES ACTIVOS (Interruptores de Eventos) ---\n`;
            contextText += `IMPORTANTE: Estos eventos YA han ocurrido o están activos:\n`;
            activeFlags.forEach(f => {
                contextText += `- [ON] ${f.name}: ${f.description || '(Sin descripción)'}\n`;
            });
        }
    }

    if (narrativeGoals && narrativeGoals.length > 0) {
        const activeGoals = narrativeGoals.filter(g => g.status === 'Active' && (g.priority === 'High' || g.priority === 'Medium'));
        if (activeGoals.length > 0) {
            contextText += `\n\n--- OBJETIVOS NARRATIVOS ACTUALES (Prioridad Alta/Media) ---\n`;
            contextText += `IMPORTANTE: Intenta guiar la narrativa hacia estos objetivos:\n`;
            activeGoals.forEach(g => {
                contextText += `- [${g.type.toUpperCase()}] ${g.description} (Prioridad: ${g.priority})\n`;
                if (g.notes) contextText += `  * Nota: ${g.notes}\n`;
            });
        }
    }

    if (secrets && secrets.length > 0 && allCharacters) {
        const activeSecrets = secrets.filter(s => 
            (s.active !== false) && 
            (s.status !== 'revealed' || s.level > 3) 
        ); 
        contextText += formatSecrets(activeSecrets, allCharacters);
    }

    const globalTraits = psychologicalTraits.filter(t => t.active !== false && !t.category.includes('Complex')); 
    if (globalTraits && globalTraits.length > 0) {
        contextText += `\n\n--- DINÁMICAS PSICOLÓGICAS (Contexto General) ---\n`;
        globalTraits.forEach(trait => {
            contextText += `- [${trait.name}] (${TRAIT_CATEGORY_LABELS[trait.category] || trait.category}): ${trait.description}\n`;
            if (trait.impact) contextText += `  >>> IMPACTO EN NARRATIVA: ${trait.impact}\n`;
            contextText += `  (Intensidad: ${trait.intensity || 5}/10)\n`;
        });
    }
    
    if (worldLogicRules && worldLogicRules.length > 0) {
        contextText += `\n\n--- REGLAS LÓGICAS DEL MUNDO (Deben seguirse según flexibilidad) ---\n`;
        worldLogicRules.forEach(rule => {
            contextText += `- ${rule.text} [Cat: ${rule.category || 'General'}, Rigidez: ${rule.flexibility || 'Absolute'}]: ${rule.description}\n`;
            if (rule.consequences) contextText += `  * Consecuencia al romperla: ${rule.consequences}\n`;
            if (rule.exceptions && rule.exceptions.length > 0) contextText += `  * Excepciones: ${rule.exceptions.join(', ')}\n`;
        });
    }
    return contextText;
};

export const formatCharacterVoices = (activeCharacters: Character[]): string => {
    if (!activeCharacters || activeCharacters.length === 0) return '';
    let text = '';
    let hasVoices = false;

    activeCharacters.forEach(char => {
        const voice = char.voice;
        if (voice && (voice.tone || voice.style || (voice.catchphrases && voice.catchphrases.length > 0))) {
            if (!hasVoices) {
                text += '\n\n--- GUÍA DE VOZ Y DIÁLOGO (Estilo de Habla Obligatorio) ---\n';
                hasVoices = true;
            }
            text += `PERSONAJE: ${char.name}\n`;
            if (voice.tone) text += `  * TONO: ${voice.tone}\n`;
            if (voice.rhythm) text += `  * RITMO: ${voice.rhythm}\n`;
            if (voice.vocabulary) text += `  * VOCABULARIO: ${voice.vocabulary}\n`;
            if (voice.style) text += `  * ESTILO: ${voice.style}\n`;
            if (voice.catchphrases && voice.catchphrases.length > 0) {
                text += `  * MULETILLAS/FRASES: ${voice.catchphrases.map(p => `"${p}"`).join(', ')}\n`;
            }
            if (voice.sampleQuote) text += `  * EJEMPLO: "${voice.sampleQuote}"\n`;
        }
    });
    
    return text;
};

export const formatCharacterVitals = (activeCharacters: Character[]): string => {
    if (!activeCharacters || activeCharacters.length === 0) return '';
    let text = '';
    let hasVitals = false;

    activeCharacters.forEach(char => {
        const attributes = char.attributes || [];
        const states = char.states?.filter(s => s.active) || [];

        if (attributes.length > 0 || states.length > 0) {
            if (!hasVitals) {
                text += '\n\n--- [ESTADO VITAL (Local / Snapshot)] ---\n'; 
                text += 'IMPORTANTE: Estos valores son absolutos y actuales para esta escena (anulan descripciones generales).\n';
                hasVitals = true;
            }
            text += `PERSONAJE: ${char.name}\n`;
            
            if (attributes.length > 0) {
                const attrStr = attributes.map(a => `${a.name}: ${a.current}/${a.max}`).join(', ');
                text += `  * [ATRIBUTOS]: ${attrStr}\n`;
            }
            
            if (states.length > 0) {
                const stateStr = states.map(s => `${s.name} (Nivel ${s.intensity || 1})`).join(', ');
                text += `  * [CONDICIONES ACTIVAS]: ${stateStr}\n`;
                states.forEach(s => {
                    if (s.description) text += `    - Detalle [${s.name}]: ${s.description}\n`;
                });
            }
        }
    });
    return text;
};

export const formatCharacterTraits = (activeCharacters: Character[], allTraits: PsychologicalTrait[]): string => {
    if (!activeCharacters || activeCharacters.length === 0) return '';
    let text = '';
    let hasTraits = false;
    
    activeCharacters.forEach(char => {
        const charTraits = allTraits.filter(t => char.traitIds?.includes(t.id) && t.active !== false);
        
        if (charTraits.length > 0 || (char.evolution && char.evolution.length > 0) || char.mainMotivation || char.archetype) {
            if (!hasTraits) {
                text += '\n\n--- PSICOLOGÍA Y EFECTOS DE PERSONAJES (Instrucciones de Comportamiento OBLIGATORIAS) ---\n';
                hasTraits = true;
            }
            text += `PERSONAJE: ${char.name}\n`;
            
            // Core Identity injection
            if (char.archetype) text += `  * ARQUETIPO: ${char.archetype}\n`;
            if (char.mainMotivation) text += `  * MOTIVACIÓN PRINCIPAL: ${char.mainMotivation}\n`;
            if (char.ticsMannerisms) text += `  * TICS/MANIERISMOS: ${char.ticsMannerisms}\n`;

            // Inject Chronological Evolution Data
            text += formatCharacterEvolution(char.evolution);

            charTraits.forEach(t => {
                text += `  * RASGO/EFECTO: ${t.name} (Categoría: ${TRAIT_CATEGORY_LABELS[t.category] || t.category})\n`;
                text += `    DESCRIPCIÓN: ${t.description}\n`;
                text += `    INTENSIDAD: ${t.intensity || 5}/10\n`;
                if(t.triggers && t.triggers.length > 0) text += `    DISPARADORES: ${t.triggers.join(', ')}\n`;
                if(t.impact) text += `    >>> IMPACTO: ${t.impact}\n`;
                if(t.evolution) text += `    >>> EVOLUCIÓN: ${t.evolution}\n`;
                if (t.details && t.details.length > 0) {
                    text += `    >>> DETALLES Y FASES ESPECÍFICAS:\n`;
                    t.details.forEach(d => {
                        text += `      - [${d.title.toUpperCase()}]: ${d.content}\n`;
                    });
                }
            });
            text += '\n';
        }
    });

    text += formatCharacterVoices(activeCharacters);
    text += formatCharacterVitals(activeCharacters);

    return text;
};

export const formatCharacterStates = (states: CharacterState[] | undefined): string => {
    if (!states || states.length === 0) return '';
    const activeStates = states.filter(s => s.active);
    if (activeStates.length === 0) return '';
    
    const stateObjects = activeStates.map(s => ({
        estado: s.name,
        tipo: s.type,
        intensidad: s.intensity || 5,
        efecto: s.gameplay_effect || s.description,
        duracion: s.duration || 'Desconocido'
    }));
    
    return JSON.stringify(stateObjects);
};

export const formatCharacterAbilities = (abilities: CharacterAbility[] | undefined): string => {
    if (!abilities || abilities.length === 0) return '';
    return abilities.map(a => {
        let desc = `${a.name} [${a.type}]`;
        if (a.tags && a.tags.length > 0) desc += ` {Tags: ${a.tags.join(', ')}}`;
        if (a.cost) desc += ` (Coste: ${a.cost})`;
        if (a.description) desc += `: ${a.description}`;
        return desc;
    }).join('; ');
};

export const formatCharacterMemories = (memories: CharacterMemory[] | undefined): string => {
    if (!memories || memories.length === 0) return '';
    return memories.map(m => {
        let text = `[${m.type.toUpperCase()}] ${m.text}`;
        if (m.timeframe) text += ` (${m.timeframe})`;
        if (m.isCore) text = `★ ${text}`; 
        return text;
    }).join(' | ');
};

export const formatCharacterRelationships = (rels: CharacterRelationship[] | undefined, allCharacters: Character[]): string => {
    if (!rels || rels.length === 0) return '';
    
    const relationshipsStructured = rels.map(r => {
        const target = allCharacters.find(c => c.id === r.targetCharacterId);
        const targetName = target ? target.name : 'Entidad Desconocida';
        
        return {
            targetName: targetName,
            relationshipType: r.type,
            affinityScore: r.score, 
            interactionStyle: r.description || "Neutral", 
            innerThoughts: r.notes || "Sin pensamientos ocultos" 
        };
    });

    return JSON.stringify(relationshipsStructured);
};

export const getBranchTypeInstruction = (branchType: string): string => {
    switch (branchType) {
        case 'unexpected':
            return 'Generate an unexpected event that subverts expectations.';
        case 'interaction':
            return 'Generate an interaction between characters, revealing something new about their relationship or personalities.';
        case 'twist':
            return 'Generate a major plot twist that re-contextualizes the story so far.';
        case 'escalation':
            return 'Generate an option that escalates the current conflict or raises the stakes for the characters.';
        case 'resolution':
            return 'Generate an option that moves towards resolving a current conflict or answering a question.';
        case 'default':
        default:
            return 'Generate a distinct and compelling option for what could happen next.';
    }
};

export const buildScenarioContext = (scenarios: Scenario[]): string => {
    if (!scenarios || scenarios.length === 0) return '';
    let text = `\n\n--- CURRENT SCENARIO(S) ---\n`;
    scenarios.forEach(s => {
        text += `- ${s.name}: ${s.description || 'No description.'} (Atmosphere: ${s.atmosphere || 'N/A'})\n`;
    });
    return text;
};

export const buildTagContext = (tags: { groupName: string; tag: Tag }[]): string => {
    if (!tags || tags.length === 0) return '';
    let text = `\n\n--- ACTIVE STATUS TAGS ---\n`;
    tags.forEach(item => {
        text += `- [${item.groupName.toUpperCase()}: ${item.tag.name}] ${item.tag.description ? `(${item.tag.description})` : ''}\n`;
    });
    return text;
};

export const buildLorebookContext = (
    relevantChars: Character[], 
    relevantScenarios: any[], 
    relevantMagic: any[], 
    relevantObjects: any[], 
    relevantSpecies: any[],
    relevantLore: LoreEntry[],
    relevantNations: Nation[], 
    allCharactersLookup: Character[],
    allTraits: PsychologicalTrait[] 
): string => {
    let text = '';
    
    // NATIONS BLOCK (Omitted for brevity as it's large and unchanged)
    
    if (relevantChars.length > 0) {
        text += `\n--- RELEVANT CHARACTERS (Auto-Detected) ---\n` + relevantChars.map(c => {
            const statesJson = formatCharacterStates(c.states);
            const abilitiesStr = formatCharacterAbilities(c.abilitiesList);
            const memoriesStr = formatCharacterMemories(c.memories);
            const relsStr = formatCharacterRelationships(c.relationships, allCharactersLookup);
            const possessionsStr = formatCharacterPossessions(c.inventory, c.resources);
            
            const evolutionBlock = formatCharacterEvolution(c.evolution);
            const vitalsBlock = formatCharacterVitals([c]); 

            let charInfo = `- ${c.name}: Arquetipo: ${c.archetype || 'Desconocido'}. Motivación: ${c.mainMotivation || 'N/A'}`;
            
            if (c.appearance) charInfo += `\n  [APARIENCIA]: ${c.appearance}`;
            if (c.ticsMannerisms) charInfo += `\n  [TICS/CONDUCTA]: ${c.ticsMannerisms}`;
            if (c.personality) charInfo += `\n  [PERSONALIDAD]: ${c.personality}`;
            if (c.backstory) charInfo += `\n  [PASADO REMOTO]: ${c.backstory}`;

            // Inject Evolution & Vitals
            if (evolutionBlock) charInfo += evolutionBlock;
            if (vitalsBlock) charInfo += vitalsBlock.replace(`PERSONAJE: ${c.name}`, ''); 
            if (possessionsStr) charInfo += possessionsStr;

            if (abilitiesStr) charInfo += `\n  [OFFICIAL SYSTEM SKILLS]: ${abilitiesStr}`;
            if (c.abilities) charInfo += `\n  [LEGACY NOTES/DRAFTS]: ${c.abilities}`;
            if (statesJson) charInfo += `\n  [CURRENT STATES JSON]: ${statesJson}`;
            if (memoriesStr) charInfo += `\n  [KEY MEMORIES]: ${memoriesStr}`;
            if (relsStr) charInfo += `\n  [RELATIONSHIPS]: ${relsStr}`;
            
            if (c.voice) {
                const v = c.voice;
                const voiceParts = [];
                if (v.tone) voiceParts.push(`Tone: ${v.tone}`);
                if (v.rhythm) voiceParts.push(`Rhythm: ${v.rhythm}`);
                if (v.style) voiceParts.push(`Style: ${v.style}`);
                if (v.vocabulary) voiceParts.push(`Vocab: ${v.vocabulary}`);
                if (v.catchphrases && v.catchphrases.length > 0) voiceParts.push(`Phrases: [${v.catchphrases.join(', ')}]`);
                if (v.sampleQuote) voiceParts.push(`Sample: "${v.sampleQuote}"`);
                if (voiceParts.length > 0) charInfo += `\n  [VOICE & DIALOGUE SIGNATURE]: ${voiceParts.join(' | ')}`;
            }

            if (c.traitIds && c.traitIds.length > 0 && allTraits.length > 0) {
                const activeTraits = allTraits.filter(t => c.traitIds?.includes(t.id) && t.active !== false);
                if (activeTraits.length > 0) {
                    let traitInfo = activeTraits.map(t => {
                        let details = `${t.name} (${t.intensity || 5}/10)`;
                        if (t.details && t.details.length > 0) {
                            details += ` [Details: ${t.details.map(d => d.title + ': ' + d.content).join('; ')}]`;
                        }
                        return details;
                    }).join('; ');
                    charInfo += `\n  [ACTIVE PSYCHOLOGICAL TRAITS]: ${traitInfo}`;
                }
            }
            
            return charInfo;
        }).join('\n');
    }
    // ... REST OF THE FILE ...
    return text;
};
