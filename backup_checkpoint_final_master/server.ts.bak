import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Initialize GoogleGenAI with mandatory User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Master 2026 Mumbai MMR localities & coordinates centered on Diva Hub (400612)
export const MMR_LOCATIONS = [
  { name: "Diva", pincode: "400612", zone: "Core (Hub)", lat: 19.1892, lng: 73.0425, distanceKm: 0, travelCharge: 0 },
  { name: "Thane West", pincode: "400601", zone: "Core", lat: 19.2183, lng: 72.9781, distanceKm: 9, travelCharge: 0 },
  { name: "Thane East", pincode: "400603", zone: "Core", lat: 19.1860, lng: 72.9754, distanceKm: 8, travelCharge: 0 },
  { name: "Kalwa", pincode: "400605", zone: "Core", lat: 19.1982, lng: 72.9969, distanceKm: 5, travelCharge: 0 },
  { name: "Mumbra", pincode: "400612", zone: "Core", lat: 19.1764, lng: 73.0229, distanceKm: 3, travelCharge: 0 },
  { name: "Dombivli East", pincode: "421201", zone: "Core", lat: 19.2184, lng: 73.0867, distanceKm: 7, travelCharge: 0 },
  { name: "Dombivli West", pincode: "421202", zone: "Core", lat: 19.2150, lng: 73.0820, distanceKm: 8, travelCharge: 0 },
  { name: "Kalyan West", pincode: "421301", zone: "Core", lat: 19.2437, lng: 73.1355, distanceKm: 14, travelCharge: 0 },
  { name: "Mulund West", pincode: "400080", zone: "Core", lat: 19.1726, lng: 72.9565, distanceKm: 12, travelCharge: 0 },
  { name: "Bhandup West", pincode: "400078", zone: "Core", lat: 19.1511, lng: 72.9372, distanceKm: 15, travelCharge: 0 },
  { name: "Kanjurmarg", pincode: "400042", zone: "Core", lat: 19.1306, lng: 72.9325, distanceKm: 18, travelCharge: 0 },
  { name: "Powai", pincode: "400076", zone: "Core", lat: 19.1176, lng: 72.9060, distanceKm: 21, travelCharge: 0 },
  { name: "Ghatkopar East", pincode: "400077", zone: "Core", lat: 19.0860, lng: 72.9080, distanceKm: 22, travelCharge: 0 },
  { name: "Vikhroli", pincode: "400079", zone: "Core", lat: 19.1110, lng: 72.9280, distanceKm: 19, travelCharge: 0 },
  { name: "Andheri East", pincode: "400069", zone: "Core", lat: 19.1136, lng: 72.8697, distanceKm: 26, travelCharge: 0 },
  { name: "Andheri West", pincode: "400058", zone: "Core", lat: 19.1363, lng: 72.8277, distanceKm: 30, travelCharge: 0 },
  { name: "Navi Mumbai - Airoli", pincode: "400708", zone: "Core", lat: 19.1579, lng: 72.9984, distanceKm: 7, travelCharge: 0 },
  { name: "Navi Mumbai - Ghansoli", pincode: "400701", zone: "Core", lat: 19.1254, lng: 73.0031, distanceKm: 10, travelCharge: 0 },
  { name: "Navi Mumbai - Vashi", pincode: "400703", zone: "Core", lat: 19.0771, lng: 72.9986, distanceKm: 16, travelCharge: 0 },
  { name: "Navi Mumbai - Nerul", pincode: "400706", zone: "Core", lat: 19.0330, lng: 73.0197, distanceKm: 22, travelCharge: 0 },
  { name: "Navi Mumbai - Kharghar", pincode: "410210", zone: "Core", lat: 19.0473, lng: 73.0699, distanceKm: 20, travelCharge: 0 },
  { name: "Navi Mumbai - Panvel", pincode: "410206", zone: "Extended Zone", lat: 18.9894, lng: 73.1175, distanceKm: 28, travelCharge: 150 },
  { name: "Bhiwandi", pincode: "421302", zone: "Extended Zone", lat: 19.2813, lng: 73.0483, distanceKm: 21, travelCharge: 150 },
  { name: "Mira Road / Bhayandar", pincode: "401107", zone: "Extended Zone", lat: 19.2812, lng: 72.8561, distanceKm: 35, travelCharge: 200 },
  { name: "South Mumbai / Colaba", pincode: "400005", zone: "Extended Zone", lat: 18.9067, lng: 72.8147, distanceKm: 42, travelCharge: 250 },
  { name: "Bandra West", pincode: "400050", zone: "Core", lat: 19.0596, lng: 72.8295, distanceKm: 33, travelCharge: 0 },
];

// System prompt grounding the model in the official Furniture Fix 2026 operating parameters
const FURNITURE_FIX_SYSTEM_PROMPT = `
You are the official Furniture Fix AI Assistant and Location Specialist.
Business Identity:
- Name: Furniture Fix
- Owner & Head Operator: Mohd Anwar Khan
- Hub Location: Diva, Thane, Maharashtra (Base Pincode: 400612)
- Service Area: Mumbai Metropolitan Region (MMR) including Diva, Thane, Navi Mumbai, Kalyan, Dombivli, Mumbra, Kalwa, Mulund, Powai, Andheri, Ghatkopar, Bhandup, Kanjurmarg, Vashi, Airoli, etc.
- Operating Hours: 8:00 AM – 10:00 PM, 7 days a week.
- Core Promise: No advance payment. Customer pays after the job is completed via Cash or UPI. Price and scope confirmed before work begins.
- Warranty Policy: No service warranty is offered. Complaints are assessed case-by-case based on the verified job record and evidence.
- Team: Core technicians TECH-001 (Mohd Anwar Khan), TECH-002 (Prakash Vishwakarma), TECH-003 (Swapnil Panchal).

2026 Itemized Rate Card (INR, per item for standard ready-to-assemble furniture):
Chairs & Tables:
- Basic chair or stool: ₹349
- Standard office chair / ergonomic chair: ₹399
- Gaming chair or recliner: ₹699
- Study table / computer desk: ₹499
- Dining table (up to 4 seats): ₹799
- Dining table (5–6 seats): ₹999
- Dining chair: ₹349

Beds:
- Single bed, standard: ₹499
- Queen bed, standard: ₹699
- King bed, standard: ₹899
- Hydraulic / storage bed: ₹1,199 (confirm mechanism & package count; quote unusual systems)
- Loft, bunk, or custom bed: Quote after photo/details

Wardrobes & Storage:
- 2-door wardrobe: ₹999
- 3-door wardrobe: ₹1,399
- 4-door wardrobe: ₹1,799
- Sliding wardrobe: ₹1,899
- Modular wardrobe / IKEA PAX: From ₹2,499 (quote after photos/dimensions)
- Shoe rack / cabinet: ₹599
- Storage cabinet / chest of drawers: ₹699

Living Room & Media:
- Small/standard TV unit (freestanding): ₹599
- Large/multi-box TV unit: from ₹899
- Standard bookshelf: ₹599
- 2-seater sofa assembly: ₹799
- 3-seater sofa assembly: ₹999
- Recliner (manual/powered): ₹799

Mounting, Fittings & Repairs:
- Simple wall mounting (one shelf / mirror): From ₹499
- TV wall mounting: From ₹799 (bracket checked, excludes electrical cabling)
- Dismantling: 60% of assembly price (min ₹299 per item)
- Minor fitting / handle / lock adjustment: ₹299 first fitting; ₹99 each additional fitting
- Drawer channel replacement: ₹299 + hardware
- Cycle assembly: ₹499
- Treadmill assembly: ₹699
- Local visit/assessment if no work proceeds: ₹199 (waived/credited if work is booked on the spot)

Travel Policy:
- Free travel inside Core Mumbai MMR Zone (Diva, Thane, Navi Mumbai, Kalyan, Dombivli, Mulund, Powai, Andheri, Ghatkopar, etc.).
- Outlying zones (e.g. Panvel, Bhiwandi, Mira-Bhayandar, South Mumbai) receive a flat distance allowance (₹150 - ₹250) quoted transparently before booking.

Your Personality & Instructions:
1. Always be polite, professional, and knowledgeable about Mumbai local geography and furniture assembly.
2. When users mention locations or pincodes, accurately confirm if Furniture Fix covers their area.
3. When users mention furniture items, quote the exact 2026 rate card price item-by-item, calculate the total clearly, and highlight: "No advance payment needed — you pay only after the job is completed!".
4. Answer location-specific travel questions (e.g., travel time from Diva/Thane, route feasibility, access considerations in high-rises or societies).
5. Always advise that customers can submit their booking directly or request an on-site photo review for custom/modular items.
6. Provide helpful responses in English or Hindi / Hinglish based on the customer's language.
`;

// API endpoint: /api/chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userLocation } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid messages parameter" });
    }

    const latestMessage = messages[messages.length - 1].content;

    // Convert past messages to formatted context
    const conversationHistory = messages
      .slice(0, -1)
      .map((m: { role: string; content: string }) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
      .join("\n");

    const promptText = `
${conversationHistory ? `Previous conversation history:\n${conversationHistory}\n\n` : ""}
Customer's latest inquiry:
${latestMessage}

${userLocation ? `Customer detected / selected locality: ${JSON.stringify(userLocation)}` : ""}
`;

    // Call @google/genai with gemini-3.8-flash and googleSearch tool for real-time Mumbai info
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: promptText,
      config: {
        systemInstruction: FURNITURE_FIX_SYSTEM_PROMPT,
        temperature: 0.6,
        tools: [{ googleSearch: {} }],
      },
    });

    const replyText = response.text || "I am here to assist you with furniture assembly across Mumbai, Thane, and Navi Mumbai. Please share your item and location!";

    // Extract grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Parse potential location and items from the response to sync the interactive map
    const mentionedLocation = MMR_LOCATIONS.find((loc) =>
      latestMessage.toLowerCase().includes(loc.name.toLowerCase()) ||
      (loc.pincode && latestMessage.includes(loc.pincode))
    );

    res.json({
      reply: replyText,
      groundingChunks,
      detectedLocation: mentionedLocation || null,
    });
  } catch (error: any) {
    console.error("Gemini API call encountered error, using intelligent local engine:", error?.message);

    // Intelligent Deterministic Fallback Engine matching official 2026 master rate card
    const lowerMsg = (req.body?.messages?.[req.body.messages.length - 1]?.content || "").toLowerCase();
    
    // Check mentioned locations
    const detectedLoc = MMR_LOCATIONS.find((loc) =>
      lowerMsg.includes(loc.name.toLowerCase()) ||
      (loc.pincode && lowerMsg.includes(loc.pincode))
    );

    // Check items mentioned
    const itemsQuoted: Array<{ name: string; price: number }> = [];
    if (lowerMsg.includes("hydraulic")) itemsQuoted.push({ name: "Hydraulic / Storage Bed", price: 1199 });
    else if (lowerMsg.includes("king bed") || lowerMsg.includes("king")) itemsQuoted.push({ name: "King Bed (Standard)", price: 899 });
    else if (lowerMsg.includes("queen bed") || lowerMsg.includes("queen")) itemsQuoted.push({ name: "Queen Bed (Standard)", price: 699 });
    else if (lowerMsg.includes("single bed") || lowerMsg.includes("single")) itemsQuoted.push({ name: "Single Bed (Standard)", price: 499 });

    if (lowerMsg.includes("sliding wardrobe") || lowerMsg.includes("sliding")) itemsQuoted.push({ name: "Sliding Wardrobe (2/3 Door)", price: 1899 });
    else if (lowerMsg.includes("4-door") || lowerMsg.includes("4 door")) itemsQuoted.push({ name: "4-Door Wardrobe", price: 1799 });
    else if (lowerMsg.includes("3-door") || lowerMsg.includes("3 door")) itemsQuoted.push({ name: "3-Door Wardrobe", price: 1399 });
    else if (lowerMsg.includes("2-door") || lowerMsg.includes("2 door")) itemsQuoted.push({ name: "2-Door Wardrobe", price: 999 });
    else if (lowerMsg.includes("pax") || lowerMsg.includes("modular")) itemsQuoted.push({ name: "Modular Wardrobe / IKEA PAX", price: 2499 });

    if (lowerMsg.includes("study") || lowerMsg.includes("desk") || lowerMsg.includes("table")) itemsQuoted.push({ name: "Study Table / Computer Desk", price: 499 });
    if (lowerMsg.includes("chair") || lowerMsg.includes("office chair")) itemsQuoted.push({ name: "Standard Office Chair", price: 399 });
    if (lowerMsg.includes("tv unit") || lowerMsg.includes("tv bench")) itemsQuoted.push({ name: "TV Unit / Console", price: 599 });
    if (lowerMsg.includes("tv mount") || lowerMsg.includes("mounting")) itemsQuoted.push({ name: "TV Wall Mounting", price: 799 });

    let intelligentReply = "";
    if (itemsQuoted.length > 0) {
      const subtotal = itemsQuoted.reduce((s, it) => s + it.price, 0);
      const locName = detectedLoc ? detectedLoc.name : "Mumbai MMR";
      const travel = detectedLoc?.travelCharge || 0;
      const total = subtotal + travel;

      intelligentReply = `Here is your official 2026 Furniture Fix quote for ${locName}:\n\n` +
        itemsQuoted.map((it) => `• ${it.name}: ₹${it.price}`).join("\n") +
        (travel > 0 ? `\n• Travel allowance (${locName}): ₹${travel}` : `\n• Travel: ₹0 (Free travel included in Core MMR zone)`) +
        `\n\n**Total Estimated Tariff: ₹${total}**\n\n` +
        `✨ **Important Promise:** No advance payment is needed! You pay only after the job is completed and inspected by you (Cash or UPI).\n` +
        `Our Diva/Thane dispatched technicians operate 8:00 AM – 10:00 PM daily. You can click 'Book a Service' above to schedule your slot!`;
    } else if (detectedLoc) {
      intelligentReply = `Yes! Furniture Fix actively services **${detectedLoc.name}** (Pincode: ${detectedLoc.pincode}) from our central Diva & Thane hub (~${detectedLoc.distanceKm} km).\n\n` +
        (detectedLoc.travelCharge === 0
          ? `✅ **Core Service Zone:** 100% Free travel included with standard rate card tariffs.`
          : `📍 **Extended Zone:** We cover this sector with a transparent ₹${detectedLoc.travelCharge} distance allowance confirmed upfront.`) +
        `\n\nWe assemble all beds, wardrobes, study desks, and office chairs with zero advance payment. Which furniture items do you need assembled?`;
    } else {
      intelligentReply = `Furniture Fix provides professional on-site furniture assembly across Mumbai, Thane, and Navi Mumbai (8:00 AM – 10:00 PM daily).\n\n` +
        `Key 2026 Customer Rates:\n` +
        `• Office Chair: ₹399 | Study Table: ₹499\n` +
        `• Queen Bed: ₹699 | King Bed: ₹899 | Hydraulic Bed: ₹1,199\n` +
        `• 2-Door Wardrobe: ₹999 | 3-Door Wardrobe: ₹1,399 | Sliding: ₹1,899\n\n` +
        `Zero advance payment — you pay only after the job is completed! Please share your locality or item to get an exact quote.`;
    }

    res.json({
      reply: intelligentReply,
      groundingChunks: [],
      detectedLocation: detectedLoc || null,
    });
  }
});

// API endpoint: /api/serviceability
app.post("/api/serviceability", (req, res) => {
  const { pincode, locality } = req.body;

  let match = null;
  if (pincode) {
    match = MMR_LOCATIONS.find((l) => l.pincode === pincode.trim());
  }
  if (!match && locality) {
    match = MMR_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(locality.toLowerCase()) ||
      locality.toLowerCase().includes(l.name.toLowerCase())
    );
  }

  if (match) {
    return res.json({
      serviceable: true,
      location: match,
      hub: "Diva, Thane (400612)",
      distanceKm: match.distanceKm,
      travelCharge: match.travelCharge,
      message: match.travelCharge === 0
        ? `Great news! ${match.name} is in our Core Service Zone with 100% free travel included.`
        : `${match.name} is covered in our Extended Zone (~${match.distanceKm} km from Diva Hub). Travel surcharge: ₹${match.travelCharge}.`,
    });
  }

  // Fallback for general Mumbai area
  res.json({
    serviceable: true,
    location: {
      name: locality || pincode || "Mumbai Metropolitan Region",
      zone: "Subject to verification",
      distanceKm: 20,
      travelCharge: 0,
      lat: 19.1892,
      lng: 73.0425,
    },
    message: "Your area is within the Mumbai Metropolitan Region. We will confirm technician arrival and exact slot review before dispatch.",
  });
});

// API endpoint: /api/health
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "Furniture Fix Operations & Map Chatbot",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Furniture Fix server running on port ${PORT}`);
  });
}

startServer();
