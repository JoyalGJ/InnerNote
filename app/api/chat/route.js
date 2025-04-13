import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const MODEL_NAME = "gemini-1.5-flash-latest"; 
const API_KEY = process.env.GEMINI_API_KEY;


const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const generationConfig = {
  temperature: 0.8,
  maxOutputTokens: 1024,
};

const systemInstructionText = `You are InnerNote, an AI diary assistant.
1. Check if the conversation history starts with context about a previous entry from today (e.g., "Continuing from earlier today...").
2. Ask 1-2 relevant follow-up questions based on the user's latest input. Keep questions concise. Ask general question as the last, if a new topic is introduced by the user ask 3 more follow up questions.
3. After 1-2 follow-ups, analyze the *entire conversation* for the day.
4. **If there was previous context provided at the start**, generate a *single, combined summary* that integrates the key points from *both* the previous context and the new chat information. Make it flow naturally.
5. **If there was no previous context**, generate a concise summary (2-4 sentences) of the user's day based on the current chat.
6. Determine the user's primary overall mood for the day based on all available information (e.g., Happy, Sad, Tired, Neutral, Mixed).
7. If asking a follow-up, respond ONLY in this JSON format:
   {"response": "Your follow-up question.", "summary": null, "mood": null}
8. If providing the final summary, respond ONLY in this JSON format:
   {"response": "Okay, I've saved a summary of your day.", "summary": "The final summary text (merged if applicable).", "mood": "The overall detected mood."}
9. Stick to these steps. No extra conversation. Max 3 follow-ups.`;



export async function POST(request) {
  console.log("[API /api/chat] Request received");

  if (!API_KEY) {
    console.error("[API /api/chat] Gemini API Key is missing");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  let clientHistory;
  try {
    const requestBody = await request.json();
    clientHistory = requestBody.history; // History sent from client
    if (!Array.isArray(clientHistory)) {
      throw new Error("'history' must be an array.");
    }
    console.log("[API /api/chat] History received from client:", clientHistory.length, "messages");
  } catch (e) {
    console.error("[API /api/chat] Invalid request body:", e.message);
    return NextResponse.json({ error: `Invalid request body: ${e.message}` }, { status: 400 });
  }

  const historyForChat = [
    { role: "user", parts: [{ text: systemInstructionText }] },
    { role: "model", parts: [{ text: "Okay, I understand my role. Ready for input." }] },
    ...(clientHistory.length > 0 && clientHistory[0].role === 'model'
         ? clientHistory.slice(1)
         : clientHistory)
  ];

  console.log("[API /api/chat] Sending", historyForChat.length, "total messages to AI model");



  if (historyForChat.length === 0 || (historyForChat[0].role !== 'user')) {
      console.error("[API /api/chat] CRITICAL ERROR: Constructed history does not start with 'user' role!", historyForChat[0]);
      return NextResponse.json({ error: "Internal server error: Failed to construct valid chat history." }, { status: 500 });
  }


  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Start the chat session with the history
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: historyForChat, 
    });

    // Generate the next message based on the history
    const result = await chat.sendMessage("Continue based on history."); 
    const aiResponseRaw = result.response.text();

    console.log("[API /api/chat] Raw AI Response received"); 

    let aiResponseJson;
    try {
      const jsonMatch = aiResponseRaw.match(/\{[\s\S]*\}/);
      if (!jsonMatch || !jsonMatch[0]) {
        throw new Error("Could not find JSON object in AI response.");
      }
      const jsonString = jsonMatch[0];
      aiResponseJson = JSON.parse(jsonString);

      if (typeof aiResponseJson.response !== 'string') {
        throw new Error("Parsed JSON is missing 'response' string field.");
      }
      aiResponseJson.summary = aiResponseJson.summary || null;
      aiResponseJson.mood = aiResponseJson.mood || null;

    } catch (parseError) {
      console.error("[API /api/chat] JSON Parsing Error:", parseError.message);
      console.error("[API /api/chat] Raw response was:", aiResponseRaw); 
      return NextResponse.json({
        response: aiResponseRaw || "AI response was unclear.",
        summary: null, mood: null, error: "AI response format error"
      }, { status: 200 });
    }

    console.log("[API /api/chat] Successfully parsed AI response");
    return NextResponse.json(aiResponseJson);

  } catch (error) {
    console.error("[API /api/chat] Error calling Gemini API:", error);
    const errorMessage = error.message || 'Unknown error during AI call.';
    return NextResponse.json({ error: `Failed to get response from AI service: ${errorMessage}` }, { status: 500 });
  }
}