import { Router, Request, Response } from "express";
import { randomUUID, createHash } from "crypto";
import { query } from "../db/neon.js";

const router = Router();

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

function makeToken(userId: string): string {
  return `mock-jwt-${userId}-${Date.now()}`;
}

function experienceToUiLevel(value: string | null | undefined) {
  if (value === "expert") return "experienced";
  if (value === "intermediate") return "intermediate";
  return "beginner";
}

function uiLevelToExperience(value: string | null | undefined) {
  if (value === "experienced") return "expert";
  if (value === "intermediate") return "intermediate";
  return "beginner";
}

function splitLocation(location: string | null) {
  if (!location) {
    return { country: "India", state: "Maharashtra" };
  }
  const [country, state] = location.split("|");
  return {
    country: country || "India",
    state: state || "Maharashtra",
  };
}

function formatUser(row: any) {
  const { country, state } = splitLocation(row.location ?? null);
  return {
    id: row.id,
    phone: row.phone,
    email: row.email || undefined,
    fullName: row.name,
    country,
    state,
    experienceLevel: experienceToUiLevel(row.experience ?? null),
    hasCompletedOnboarding: Boolean(row.has_completed_onboarding),
    createdAt: row.created_at,
    isDemoUser: false,
    isFirstLogin: false,
  };
}

router.post("/signup", async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      phone,
      password,
      email,
      country = "India",
      state = "Maharashtra",
      experienceLevel = "beginner",
    } = req.body ?? {};

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: "fullName, phone and password are required" });
    }

    const normalizedPhone = String(phone).trim();
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const location = `${country}|${state}`;
    const experience = uiLevelToExperience(experienceLevel);

    const existing = await query(
      "SELECT id FROM farmers WHERE phone = $1 LIMIT 1",
      [normalizedPhone],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    const id = randomUUID();
    const passwordHash = hashPassword(String(password));

    const inserted = await query(
      `
      INSERT INTO farmers (id, name, phone, email, location, password, experience, has_completed_onboarding)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, phone, email, location, experience, has_completed_onboarding, created_at
      `,
      [id, String(fullName).trim(), normalizedPhone, normalizedEmail, location, passwordHash, experience, false],
    );

    const user = formatUser(inserted.rows[0]);
    user.isFirstLogin = true;
    const token = makeToken(user.id);
    return res.status(201).json({ user, token });
  } catch (error: any) {
    // If DB schema hasn't been migrated with auth columns yet, fail clearly.
    if (error?.code === "42703") {
      return res.status(500).json({
        message:
          "Auth columns missing in farmers table (password/experience/has_completed_onboarding). Run auth schema migration first.",
      });
    }
    console.error("[auth/signup] error:", error);
    return res.status(500).json({ message: "Signup failed" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body ?? {};
    if (!phone || !password) {
      return res.status(400).json({ message: "phone and password are required" });
    }

    const result = await query(
      `
      SELECT id, name, phone, email, location, password, experience, has_completed_onboarding, created_at
      FROM farmers
      WHERE phone = $1
      LIMIT 1
      `,
      [String(phone).trim()],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    const row = result.rows[0];
    const incomingHash = hashPassword(String(password));
    if (!row.password || row.password !== incomingHash) {
      return res.status(401).json({ message: "Invalid phone or password" });
    }

    const user = formatUser(row);
    const token = makeToken(user.id);
    return res.json({ user, token });
  } catch (error: any) {
    if (error?.code === "42703") {
      return res.status(500).json({
        message:
          "Auth columns missing in farmers table (password/experience/has_completed_onboarding). Run auth schema migration first.",
      });
    }
    console.error("[auth/login] error:", error);
    return res.status(500).json({ message: "Login failed" });
  }
});

router.post("/logout", async (_req: Request, res: Response) => {
  return res.json({ success: true });
});

router.put("/update", async (req: Request, res: Response) => {
  try {
    const { id, fullName, email, phone } = req.body ?? {};
    if (!id) {
      return res.status(400).json({ message: "id is required for profile update" });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (fullName) {
      updates.push(`name = $${idx++}`);
      values.push(String(fullName).trim());
    }
    if (email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(email ? String(email).trim().toLowerCase() : null);
    }
    if (phone) {
      updates.push(`phone = $${idx++}`);
      values.push(String(phone).trim());
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(String(id));
    const sql = `
      UPDATE farmers
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, name, phone, email, location, experience, has_completed_onboarding, created_at
    `;

    const updated = await query(sql, values);
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: formatUser(updated.rows[0]) });
  } catch (error: any) {
    console.error("[auth/update] error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token.startsWith("mock-jwt-")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const afterPrefix = token.substring(9);
    const lastDash = afterPrefix.lastIndexOf("-");
    if (lastDash <= 0) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = afterPrefix.substring(0, lastDash);

    const result = await query(
      `
      SELECT id, name, phone, email, location, experience, has_completed_onboarding, created_at
      FROM farmers
      WHERE id = $1
      LIMIT 1
      `,
      [userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: formatUser(result.rows[0]) });
  } catch (error: any) {
    console.error("[auth/me] error:", error);
    return res.status(500).json({ message: "Failed to load current user" });
  }
});

export default router;
