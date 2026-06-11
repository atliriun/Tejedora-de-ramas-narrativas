
import { Type } from "@google/genai";

export const branchesResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'A brief, compelling option for the next part of the story.' },
    },
    required: ['name'],
  },
};

export const singleBranchResponseSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'A brief, compelling alternative event for this part of the story.' },
    },
    required: ['name'],
  };

export const plotContinuationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A very brief, one-sentence summary of the next event." },
        details: { type: Type.STRING, description: "A detailed continuation of the story in one or two paragraphs." },
    },
    required: ['summary', 'details'],
};

export const worldBuildingDetailsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING, description: 'A short, memorable title for the rule or function.' },
            description: { type: Type.STRING, description: 'A one-sentence description of the rule or function.' },
        },
        required: ['text', 'description'],
    },
};
