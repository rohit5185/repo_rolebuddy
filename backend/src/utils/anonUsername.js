import { User } from "../features/auth/auth.model.js";

// ── Word lists ────────────────────────────────────────────────────────────────

const TECH_PREFIXES = [
  "Backend", "React", "Node", "Java", "Python", "Data", "Cloud",
  "DevOps", "Mobile", "API", "ML", "Frontend", "Fullstack", "Go",
  "Rust", "TypeScript", "Kubernetes", "Docker", "Security", "QA"
];

const NON_TECH_PREFIXES = [
  "Marketing", "Sales", "Finance", "HR", "Design", "Product",
  "Operations", "Strategy", "Research", "Legal", "Content", "Brand",
  "Growth", "UX", "Business"
];

const ALL_PREFIXES = [...TECH_PREFIXES, ...NON_TECH_PREFIXES];

const SUFFIXES = [
  "Tiger", "Falcon", "Voyager", "Pilot", "Explorer",
  "Navigator", "Mentor", "Guide", "Scout", "Ranger",
  "Eagle", "Phoenix", "Hawk", "Wolf", "Fox"
];

const FALLBACK_PREFIX = "RoleBuddy";

// ── Helpers ───────────────────────────────────────────────────────────────────

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPrefixPool(domain) {
  if (domain === "tech") return TECH_PREFIXES;
  if (domain === "non-tech") return NON_TECH_PREFIXES;
  return ALL_PREFIXES;
}

/**
 * Build a candidate username string — no DB access.
 * @param {string|null} domain - "tech" | "non-tech" | null
 * @returns {string}
 */
export function buildCandidateUsername(domain = null) {
  const prefix = pickRandom(getPrefixPool(domain));
  const suffix = pickRandom(SUFFIXES);
  return `${prefix}${suffix}`;
}

/**
 * Check if a username is already taken (DB lookup).
 * @param {string} username
 * @returns {Promise<boolean>}
 */
async function isTaken(username) {
  const existing = await User.findOne({ anonUsername: username }).select("_id").lean();
  return Boolean(existing);
}

/**
 * Generate and persist a unique anonUsername for the given user.
 * Safe to call multiple times — skips users who already have one.
 *
 * @param {import("mongoose").Types.ObjectId|string} userId
 * @param {string|null} domain - "tech" | "non-tech" | null
 * @returns {Promise<string>} the assigned username
 */
export async function assignAnonUsername(userId, domain = null) {
  // Idempotency — if already set, return the existing value
  const existing = await User.findById(userId).select("anonUsername").lean();
  if (existing?.anonUsername) {
    return existing.anonUsername;
  }

  const MAX_ATTEMPTS = 15;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let candidate = buildCandidateUsername(domain);

    // Append a numeric suffix on repeated collisions
    if (attempt > 0) {
      const suffix = attempt < 5
        ? String(Math.floor(Math.random() * 90) + 10)   // 10-99
        : String(Math.floor(Math.random() * 900) + 100); // 100-999
      candidate = `${candidate}${suffix}`;
    }

    const taken = await isTaken(candidate);
    if (!taken) {
      await User.updateOne({ _id: userId }, { $set: { anonUsername: candidate } });
      return candidate;
    }
  }

  // Hard fallback — nearly impossible to collide
  const fallback = `${FALLBACK_PREFIX}${pickRandom(SUFFIXES)}${Date.now().toString(36).slice(-4).toUpperCase()}`;
  await User.updateOne({ _id: userId }, { $set: { anonUsername: fallback } });
  return fallback;
}
