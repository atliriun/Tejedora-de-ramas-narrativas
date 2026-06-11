const d = {
    storyArcs: [
        {
            rootNode: {
                id: '123',
                blocks: [
                    { id: '1', text: 'Hello Antonio' }
                ],
                name: 'Antonio node',
                children: [
                    { id: '456', blocks: [{ id: '2', text: 'More array stuff Antonio.'}], name: 'Antonio second' }
                ]
            }
        }
    ],
    characters: [
        { name: 'Antonio', aliases: ['Antonio The Great'] }
    ]
};

const searchStr = 'Antonio';
const replaceStr = 'Marco';
const textualKeys = new Set([
    'text', 'name', 'description', 'content', 'note', 'summary', 
    'appearance', 'personality', 'backstory', 'mainMotivation', 
    'ticsMannerisms', 'catchphrases', 'sampleQuote', 'notes', 
    'atmosphere', 'sensoryDetails', 'aliases', 'chatDraft', 'customArcSummary', 'customCharactersSummary', 'lastPlotGuidance'
]);

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp(escapeRegExp(searchStr), 'g');

const recursiveReplace = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
        return obj; // We only replace specific keys
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => recursiveReplace(item));
    }
    
    if (typeof obj === 'object') {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            if (textualKeys.has(key)) {
                if (typeof value === 'string') {
                    newObj[key] = value.replace(regex, replaceStr);
                } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
                    newObj[key] = value.map(v => typeof v === 'string' ? v.replace(regex, replaceStr) : v);
                } else if (typeof value === 'object') {
                    newObj[key] = recursiveReplace(value);
                } else {
                    newObj[key] = value;
                }
            } else if (typeof value === 'object') {
                newObj[key] = recursiveReplace(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    }
    
    return obj;
};

console.log(JSON.stringify(recursiveReplace(d), null, 2));
