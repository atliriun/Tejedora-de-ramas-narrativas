
/**
 * Filters a list of entities based on whether their name or aliases appear in the provided text.
 * This implements the "Lorebook" logic: only send relevant entities to save tokens and avoid hallucinations.
 */
export const filterContextByKeywords = <T extends { name: string; aliases?: string[] }>(
    textToScan: string,
    entities: T[]
): T[] => {
    if (!textToScan || !entities) return [];
    const normalizedText = textToScan.toLowerCase();
    return entities.filter(entity => {
        // Check exact name match (case-insensitive)
        if (normalizedText.includes(entity.name.toLowerCase())) return true;
        
        // Check aliases
        if (entity.aliases && entity.aliases.length > 0) {
            return entity.aliases.some(alias => normalizedText.includes(alias.toLowerCase()));
        }
        return false;
    });
};
