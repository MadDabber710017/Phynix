import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db";

const JWT_SECRET = process.env.SESSION_SECRET || "phynix-default-secret-change-me";
const TOKEN_EXPIRY = "30d";

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  profile_pic: string | null;
  bio: string | null;
  created_at: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function initAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      profile_pic TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_grows (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      grow_data JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_gamification (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      gamification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id)
    )
  `);

  try {
    await pool.query(`ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id)`);
    await pool.query(`ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id)`);
    await pool.query(`ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id)`);
    await pool.query(`ALTER TABLE community_follows ADD COLUMN IF NOT EXISTS follower_user_id VARCHAR REFERENCES users(id)`);
    await pool.query(`ALTER TABLE community_follows ADD COLUMN IF NOT EXISTS following_user_id VARCHAR REFERENCES users(id)`);
  } catch (e) {
    // columns may already exist
  }
}

function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function sanitizeUser(row: any): AuthUser {
  return {
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    profile_pic: row.profile_pic || null,
    bio: row.bio || null,
    created_at: row.created_at,
  };
}

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: "Email, password, and display name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (email, password, display_name) VALUES ($1, $2, $3) RETURNING *",
      [email.toLowerCase().trim(), hashedPassword, displayName.trim()]
    );

    const user = sanitizeUser(result.rows[0]);
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Failed to create account" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const sanitized = sanitizeUser(user);
    const token = generateToken(sanitized);

    res.json({ user: sanitized, token });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to sign in" });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: req.user });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  try {
    const { displayName, profilePic, bio } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${idx++}`);
      values.push(displayName.trim());
    }
    if (profilePic !== undefined) {
      updates.push(`profile_pic = $${idx++}`);
      values.push(profilePic);
    }
    if (bio !== undefined) {
      updates.push(`bio = $${idx++}`);
      values.push(bio);
    }

    if (updates.length === 0) return res.json({ user: req.user });

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (err: any) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };

    pool.query("SELECT * FROM users WHERE id = $1", [decoded.id])
      .then((result) => {
        if (result.rows.length > 0) {
          req.user = sanitizeUser(result.rows[0]);
        }
        next();
      })
      .catch(() => next());
  } catch {
    next();
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}
