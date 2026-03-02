import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import express from "express";
import { pool } from "./db";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  const bodyParser = express.json({ limit: "20mb" });

  // ---- AI Plant Analysis ----
  app.post("/api/analyze-plant", bodyParser, async (req: Request, res: Response) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "imageBase64 is required" });

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are an expert cannabis cultivation specialist with 20+ years of experience. Analyze cannabis plant images and provide detailed, accurate assessments. Always respond with valid JSON only, no markdown, no extra text.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" },
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
  "observations": ["<specific observation>"],
  "issues": [{"name": "<name>","severity": "Low|Medium|High","description": "<what you see>","fix": "<how to fix>"}],
  "positives": ["<thing that looks good>"],
  "recommendations": ["<actionable recommendation>"],
  "nutrientStatus": {"nitrogen": "Deficient|Low|Optimal|High|Excess","phosphorus": "Deficient|Low|Optimal|High|Excess","potassium": "Deficient|Low|Optimal|High|Excess","overall": "<brief summary>"},
  "environmentHints": "<any clues about growing environment>",
  "funFact": "<interesting cannabis cultivation fact relevant to what you see>"
}
If not a cannabis plant, set overallHealth to "Unknown", healthScore to 0.`,
              },
            ],
          },
        ],
        max_completion_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content ?? "";
      const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      res.json(JSON.parse(cleanJson));
    } catch (error) {
      console.error("Plant analysis error:", error);
      res.status(500).json({ error: "Failed to analyze plant" });
    }
  });

  // ---- Community Posts ----

  // GET all posts (newest first)
  app.get("/api/community/posts", async (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string || "";
      const { rows } = await pool.query(`
        SELECT cp.*,
          CASE WHEN pl.device_id IS NOT NULL THEN true ELSE false END as liked_by_me
        FROM community_posts cp
        LEFT JOIN post_likes pl ON cp.id = pl.post_id AND pl.device_id = $1
        ORDER BY cp.created_at DESC
        LIMIT 50
      `, [deviceId]);
      res.json(rows);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // POST create a new community post
  app.post("/api/community/posts", bodyParser, async (req: Request, res: Response) => {
    try {
      const { growerName, strain, stage, title, description, imageBase64 } = req.body;
      if (!growerName || !title || !description || !stage) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { rows } = await pool.query(
        `INSERT INTO community_posts (grower_name, strain, stage, title, description, image_base64)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [growerName.trim(), strain?.trim() || "Unknown", stage, title.trim(), description.trim(), imageBase64 || null]
      );
      res.status(201).json({ ...rows[0], liked_by_me: false });
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // POST toggle like on a post
  app.post("/api/community/posts/:id/like", bodyParser, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      const { deviceId } = req.body;
      if (!deviceId) return res.status(400).json({ error: "deviceId required" });

      // Check if already liked
      const existing = await pool.query(
        "SELECT id FROM post_likes WHERE post_id = $1 AND device_id = $2",
        [postId, deviceId]
      );

      let liked: boolean;
      if (existing.rows.length > 0) {
        // Unlike
        await pool.query("DELETE FROM post_likes WHERE post_id = $1 AND device_id = $2", [postId, deviceId]);
        await pool.query("UPDATE community_posts SET likes = GREATEST(0, likes - 1) WHERE id = $1", [postId]);
        liked = false;
      } else {
        // Like
        await pool.query("INSERT INTO post_likes (post_id, device_id) VALUES ($1, $2)", [postId, deviceId]);
        await pool.query("UPDATE community_posts SET likes = likes + 1 WHERE id = $1", [postId]);
        liked = true;
      }

      const { rows } = await pool.query("SELECT likes FROM community_posts WHERE id = $1", [postId]);
      res.json({ liked, likes: rows[0]?.likes ?? 0 });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // DELETE a post (only if posted from same device — optional honor system)
  app.delete("/api/community/posts/:id", bodyParser, async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.id);
      await pool.query("DELETE FROM community_posts WHERE id = $1", [postId]);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
