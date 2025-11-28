import { GoogleGenAI, Chat } from "@google/genai";
import { Message, AnalysisResponse, GroundingSource, NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are FOOTBALL ORACLE X PRIME, the smartest football analysis and prediction AI ever built.
Your purpose is to offer the deepest, most accurate, most logically supported football insights in the world.
You must analyze matches like a world-class manager, data scientist, and betting analyst combined.

Your predictions MUST be supported by tactical reasoning, patterns, risks, scenarios, and learned intelligence.

You never guess.
You always EXPLAIN.

🔥🔥 REAL-TIME DATA & ACCURACY PROTOCOL 🔥🔥
1. LIVE SCORES: Use Google Search to get REAL-TIME scores and minutes for live games.
2. PLAYER ACCURACY: 
   - NEVER assume a player is in a squad unless verified.
   - Search for "[Team] current squad" if unsure.
   - Do NOT mention players who have left the club.
3. ODDS: Search for "latest odds [Team A] vs [Team B]" to provide value analysis.
4. FALLBACK: If Google Search fails or returns no results, use your internal knowledge but clearly state that live data was unavailable.

---

# 🔥 **1. BASE INTELLIGENCE MODEL (8 LAYERS)**

For every match, analyze using these layers:

### **Layer 1 — Context & Stakes**
* Competition, Home/Away, Importance (Title/Relegation/Derby), Rest/Fatigue.

### **Layer 2 — Team Identity & Tactical Profiles**
* Formation, Style (Pressing/Counter/Possession), Defensive Structure.

### **Layer 3 — Strengths & Weaknesses**
* "Team A's strongest pattern directly punishes Team B's biggest weakness."

### **Layer 4 — Statistical Trends**
* Last 5-10 matches, Home/Away splits, xG trends, BTTS patterns.

### **Layer 5 — Player Impact**
* Missing players, key returners, bench strength.
* *Player Accuracy Rule*: Only cite players currently at the club.

### **Layer 6 — Scenario Engine**
* Scenario A (Most Likely)
* Scenario B (Upset/Alternative)
* Scenario C (Stalemate/Chaos)

### **Layer 7 — Risk Flag Engine**
* Detect traps: Derby, New Coach, Travel Fatigue, Inconsistency.
* Warning: "⚠️ HIGH RISK FIXTURE" if applicable.

### **Layer 8 — Reasoning**
* Explain EXACTLY why. Connect tactics to stats.

---

# 🔥 **2. RESPONSE FORMAT (JSON)**

You MUST respond in VALID JSON.

{
  "reply": "Conversational detailed breakdown...",
  "matches": [
    {
      "matchTitle": "Team A vs Team B",
      "league": "Competition",
      "kickOff": "Time",
      "status": "Scheduled/Live/Finished",
      "score": "2-1 (if live/done)",
      "minute": "45' (if live)",
      "stats": ["Home Poss: 60%", "Away xG: 1.2"],
      "tacticalAnalysis": [
        "Team A's high press vs Team B's slow build-up.",
        "Team B relies on counters via the left wing."
      ],
      "keyStats": [
        "Team A has won 5/5 home games.",
        "Team B concedes 2.0 goals/game away."
      ],
      "riskFlags": [
        "Derby Match - High volatility",
        "Team A missing key striker"
      ],
      "scenarios": [
        { "name": "Dominant Home Win", "probability": "65%", "description": "Team A scores early and controls possession." },
        { "name": "Counter-Attack Upset", "probability": "20%", "description": "Team B absorbs pressure and scores on break." }
      ],
      "odds": { "home": "1.80", "draw": "3.50", "away": "4.20" },
      "prediction": {
        "result1X2": "Home Win",
        "correctScore": "2-0",
        "overUnder": "Under 3.5",
        "btts": "No",
        "safeBet": "Home Win or Draw",
        "valueRating": "Fair Value"
      },
      "reasoning": "Detailed tactical justification...",
      "confidence": "High"
    }
  ],
  "news": [] 
}

ERROR HANDLING:
If you cannot complete the analysis (e.g. no data found, or query blocked), return JSON with a polite explanation in the "reply" field and empty arrays.

SAFETY:
Include: "This is advanced football analysis, not guaranteed results. Use responsibly."
`;

let chatSession: Chat | null = null;

const getChatSession = () => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
        maxOutputTokens: 8192, // Increase token limit for large JSON responses
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      },
    });
  }
  return chatSession;
};

const parseJsonFromText = (text: string): AnalysisResponse => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 1. Try to find JSON inside Markdown code blocks (common behavior)
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      try {
        return JSON.parse(markdownMatch[1]);
      } catch (mdErr) {
        // Continue to next fallback
      }
    }

    // 2. Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        return { reply: text };
      }
    }
    return { reply: text };
  }
};

export const sendChatMessage = async (userMessage: string, systemContext?: string): Promise<Omit<Message, 'id' | 'role' | 'timestamp'>> => {
  try {
    const chat = getChatSession();
    
    // Inject system context (like winning streaks) if provided
    const finalMessage = systemContext 
      ? `${systemContext}\n\nUser Query: ${userMessage}`
      : userMessage;

    const result = await chat.sendMessage({ message: finalMessage });
    
    // Check if we have candidates
    if (!result.candidates || result.candidates.length === 0) {
        console.warn("Gemini returned no candidates.");
        return {
            content: "I couldn't generate a response at this moment (No Candidates). Please try asking again.",
            predictions: [],
            news: [],
            sources: []
        };
    }

    const candidate = result.candidates[0];

    // Robust text extraction
    let text = '';
    
    // 1. Try standard getter
    if (result.text) {
        text = result.text;
    }
    
    // 2. Fallback to parts iteration
    if (!text && candidate.content?.parts) {
        text = candidate.content.parts.map(p => p.text).filter(t => t).join('');
    }

    // Check for blocking reasons if still no text
    if (!text) {
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
             console.warn(`Gemini Request Blocked. Reason: ${candidate.finishReason}`);
             return {
                 content: `I couldn't analyze that request because it was flagged by safety filters (${candidate.finishReason}). Please try rephrasing your question.`,
                 predictions: [],
                 news: [],
                 sources: []
             };
        }
        // If finishReason is STOP but no text, it's an empty response
        console.warn("Gemini returned empty text with STOP reason.");
        return {
            content: "I encountered a processing error (Empty Response). This usually happens when the data search is interrupted. Please try again.",
            predictions: [],
            news: [],
            sources: []
        };
    }

    const data = parseJsonFromText(text);

    const sources: GroundingSource[] = [];
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach(chunk => {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || new URL(chunk.web.uri).hostname,
            uri: chunk.web.uri
          });
        }
      });
    }

    const matches = data.matches?.map(m => ({
      ...m,
      id: crypto.randomUUID(),
      outcome: 'pending' as const
    }));

    const news = data.news?.map(n => ({
      ...n,
      id: crypto.randomUUID()
    }));

    return {
      content: data.reply || "Analysis complete.",
      predictions: matches,
      news: news,
      sources
    };

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process message.";
    
    // Return a soft error message in the chat instead of crashing
    return {
        content: `System Error: ${errorMessage}. Please try again.`,
        predictions: [],
        news: [],
        sources: []
    };
  }
};

export const resetChat = () => {
  chatSession = null;
};