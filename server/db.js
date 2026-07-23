import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '../data')
const DB_PATH = path.join(DATA_DIR, 'users.json')

export const ADMIN_EMAIL = 'smonroe@macknightsafety.com'
export const DEFAULT_ADMIN_PASSWORD = 'MacknightAdmin!2026'

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    const seed = { users: [], resetTokens: [] }
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2))
    return seed
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function writeDb(db) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export function listUsers() {
  return ensureDb().users.map(publicUser)
}

export function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase()
  return ensureDb().users.find((u) => u.email === normalized) ?? null
}

export function findUserById(id) {
  return ensureDb().users.find((u) => u.id === id) ?? null
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash)
}

export async function seedAdminIfNeeded() {
  const db = ensureDb()
  const existing = db.users.find((u) => u.email === ADMIN_EMAIL)
  if (existing) {
    return { created: false, email: ADMIN_EMAIL }
  }

  const now = new Date().toISOString()
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12)
  db.users.push({
    id: crypto.randomUUID(),
    email: ADMIN_EMAIL,
    name: 'S. Monroe',
    role: 'admin',
    passwordHash,
    active: true,
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  })
  writeDb(db)
  return {
    created: true,
    email: ADMIN_EMAIL,
    temporaryPassword: DEFAULT_ADMIN_PASSWORD,
  }
}

export async function createUser(input) {
  const db = ensureDb()
  const email = input.email.trim().toLowerCase()
  if (db.users.some((u) => u.email === email)) {
    throw new Error('A user with that email already exists.')
  }
  if (input.password.length < 10) {
    throw new Error('Password must be at least 10 characters.')
  }

  const now = new Date().toISOString()
  const user = {
    id: crypto.randomUUID(),
    email,
    name: input.name.trim() || email.split('@')[0],
    role: input.role === 'admin' ? 'admin' : 'sales',
    passwordHash: await bcrypt.hash(input.password, 12),
    active: true,
    mustChangePassword: true,
    createdAt: now,
    updatedAt: now,
  }
  db.users.push(user)
  writeDb(db)
  return publicUser(user)
}

export async function setUserPassword(userId, password, opts = {}) {
  if (password.length < 10) {
    throw new Error('Password must be at least 10 characters.')
  }
  const db = ensureDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  user.passwordHash = await bcrypt.hash(password, 12)
  user.mustChangePassword = Boolean(opts.mustChange)
  user.updatedAt = new Date().toISOString()
  writeDb(db)
  return publicUser(user)
}

export function setUserActive(userId, active) {
  const db = ensureDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  if (user.email === ADMIN_EMAIL && !active) {
    throw new Error('Cannot deactivate the primary admin account.')
  }
  user.active = active
  user.updatedAt = new Date().toISOString()
  writeDb(db)
  return publicUser(user)
}

export function setUserRole(userId, role) {
  const db = ensureDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found.')
  if (user.email === ADMIN_EMAIL && role !== 'admin') {
    throw new Error('Cannot demote the primary admin account.')
  }
  user.role = role
  user.updatedAt = new Date().toISOString()
  writeDb(db)
  return publicUser(user)
}

export async function createPasswordResetToken(email) {
  const db = ensureDb()
  const user = db.users.find((u) => u.email === email.trim().toLowerCase() && u.active)
  if (!user) return null

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60).toISOString()

  for (const token of db.resetTokens) {
    if (token.userId === user.id && !token.usedAt) {
      token.usedAt = now.toISOString()
    }
  }

  db.resetTokens.push({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
    usedAt: null,
    createdAt: now.toISOString(),
  })
  writeDb(db)

  return { user, rawToken, expiresAt }
}

export async function resetPasswordWithToken(rawToken, newPassword) {
  if (newPassword.length < 10) {
    throw new Error('Password must be at least 10 characters.')
  }
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const db = ensureDb()
  const token = db.resetTokens.find((t) => t.tokenHash === tokenHash)
  if (!token || token.usedAt) {
    throw new Error('Invalid or expired reset link.')
  }
  if (new Date(token.expiresAt).getTime() < Date.now()) {
    throw new Error('Invalid or expired reset link.')
  }
  const user = db.users.find((u) => u.id === token.userId)
  if (!user || !user.active) {
    throw new Error('Invalid or expired reset link.')
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12)
  user.mustChangePassword = false
  user.updatedAt = new Date().toISOString()
  token.usedAt = new Date().toISOString()
  writeDb(db)
  return publicUser(user)
}

export { DATA_DIR }
