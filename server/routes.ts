import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import express from "express";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  const bodyParser = express.json({ limit: "20mb" });

  app.post("/api/analyze-plant", bodyParser, async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an expert cannabis cultivation specialist with 20+ years of experience. 
Analyze cannabis plant images and provide detailed, accurate assessments.
Always respond with valid JSON only, no markdown, no extra text.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: `Analyze this cannabis plant image and return a JSON object with this exact structure:
{
  "overallHealth": "Excellent|Good|Fair|Poor|Critical",
  "healthScore": <number 0-100>,
  "growthStage": "Germination|Seedling|Early Vegetative|Late Vegetative|Pre-Flower|Early Flower|Mid Flower|Late Flower|Harvest Ready|Curing",
  "stageWeeksEstimate": "<estimated weeks into current stage>",
  "estimatedWeeksToHarvest": "<number or null if not applicable>",
  "observations": [
    "<specific observation about the plant>",
    "<another observation>"
  ],
  "issues": [
    {
      "name": "<issue name>",
      "severity": "Low|Medium|High",
      "description": "<what you see>",
      "fix": "<how to fix it>"
    }
  ],
  "positives": ["<thing that looks good>"],
  "recommendations": [
    "<actionable recommendation>",
    "<another recommendation>"
  ],
  "nutrientStatus": {
    "nitrogen": "Deficient|Low|Optimal|High|Excess",
    "phosphorus": "Deficient|Low|Optimal|High|Excess",
    "potassium": "Deficient|Low|Optimal|High|Excess",
    "overall": "<brief nutrient summary>"
  },
  "environmentHints": "<any clues about growing environment from the image>",
  "funFact": "<an interesting cannabis cultivation fact relevant to what you see>"
}

If this is not a cannabis plant, set overallHealth to "Unknown", healthScore to 0, and explain in observations.`,
              },
            ],
          },
        ],
        max_completion_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content ?? "";
      const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const analysis = JSON.parse(cleanJson);
      res.json(analysis);
    } catch (error) {
      console.error("Plant analysis error:", error);
      if (error instanceof SyntaxError) {
        res.status(500).json({ error: "Failed to parse AI response" });
      } else {
        res.status(500).json({ error: "Failed to analyze plant" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
