import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'
import {
  ADMIN_EMAIL,
  createPasswordResetToken,
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  publicUser,
  resetPasswordWithToken,
  seedAdminIfNeeded,
  setUserActive,
  setUserPassword,
  setUserRole,
  verifyPassword,
} from './db.js'
import { sendPasswordResetEmail } from './mail.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8787)
const JWT_SECRET = process.env.JWT_SECRET || 'macknight-dev-secret-change-me'
const APP_ORIGIN = process.env.APP_ORIGIN || `http://localhost:${PORT}`
const IS_PROD = process.env.NODE_ENV === 'production'
const COOKIE_NAME = 'macknight_session'

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: IS_PROD ? APP_ORIGIN : true,
    credentials: true,
  }),
)

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
}

function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

function readAuth(req) {
  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const token = req.cookies?.[COOKIE_NAME] || bearer
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

function requireAuth(req, res, next) {
  const payload = readAuth(req)
  if (!payload) {
    return res.status(401).json({ error: 'Authentication required.' })
  }
  const user = findUserById(payload.sub)
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Authentication required.' })
  }
  req.user = user
  req.auth = payload
  next()
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required.' })
    }
    next()
  })
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
    const password = String(req.body?.password || '')
    const user = findUserByEmail(email)
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }
    const ok = await verifyPassword(user, password)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }
    const token = signToken(user)
    setSessionCookie(res, token)
    res.json({ user: publicUser(user), token })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Login failed.' })
  }
})

app.post('/api/auth/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '')
    const newPassword = String(req.body?.newPassword || '')
    const ok = await verifyPassword(req.user, currentPassword)
    if (!ok) {
      return res.status(400).json({ error: 'Current password is incorrect.' })
    }
    const user = await setUserPassword(req.user.id, newPassword, { mustChange: false })
    const token = signToken(findUserById(req.user.id))
    setSessionCookie(res, token)
    res.json({ user })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not change password.' })
  }
})

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = String(req.body?.email || '')
    const created = await createPasswordResetToken(email)
    let resetUrl = null

    if (created) {
      resetUrl = `${APP_ORIGIN}/reset-password?token=${created.rawToken}`
      const mail = await sendPasswordResetEmail({
        to: created.user.email,
        resetUrl,
      })
      // In non-SMTP setups, return the link so admins/devs can complete reset.
      // Still use a generic message in the UI; admin can also force-reset.
      return res.json({
        ok: true,
        message: 'If an account exists for that email, reset instructions were sent.',
        delivered: mail.delivered,
        // Only expose link when SMTP is not configured (dev / bootstrap).
        resetUrl: mail.delivered ? undefined : resetUrl,
      })
    }

    res.json({
      ok: true,
      message: 'If an account exists for that email, reset instructions were sent.',
    })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Could not start password reset.' })
  }
})

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const token = String(req.body?.token || '')
    const newPassword = String(req.body?.newPassword || '')
    const user = await resetPasswordWithToken(token, newPassword)
    const session = signToken(findUserById(user.id))
    setSessionCookie(res, session)
    res.json({ user, token: session })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not reset password.' })
  }
})

app.get('/api/admin/users', requireAdmin, (_req, res) => {
  res.json({ users: listUsers(), adminEmail: ADMIN_EMAIL })
})

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const user = await createUser({
      email: String(req.body?.email || ''),
      name: String(req.body?.name || ''),
      role: req.body?.role === 'admin' ? 'admin' : 'sales',
      password: String(req.body?.password || ''),
    })
    res.status(201).json({ user })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create user.' })
  }
})

app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const id = req.params.id
    let user = findUserById(id)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    if (typeof req.body?.active === 'boolean') {
      user = setUserActive(id, req.body.active)
    }
    if (req.body?.role === 'admin' || req.body?.role === 'sales') {
      user = setUserRole(id, req.body.role)
    }
    if (req.body?.password) {
      user = await setUserPassword(id, String(req.body.password), {
        mustChange: req.body.mustChangePassword !== false,
      })
    }
    res.json({ user })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not update user.' })
  }
})

app.post('/api/admin/users/:id/reset-link', requireAdmin, async (req, res) => {
  try {
    const user = findUserById(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const created = await createPasswordResetToken(user.email)
    if (!created) return res.status(400).json({ error: 'Could not create reset link.' })
    const resetUrl = `${APP_ORIGIN}/reset-password?token=${created.rawToken}`
    const mail = await sendPasswordResetEmail({ to: user.email, resetUrl })
    res.json({
      ok: true,
      delivered: mail.delivered,
      resetUrl,
      expiresAt: created.expiresAt,
    })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Could not create reset link.' })
  }
})

const distDir = path.resolve(__dirname, '../dist')
app.use(express.static(distDir))
app.get(/^(?!\/api).*/, (req, res, next) => {
  if (req.method !== 'GET') return next()
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next()
  })
})

const seed = await seedAdminIfNeeded()
if (seed.created) {
  console.log(`[auth] Seeded admin ${seed.email}`)
  console.log(`[auth] Temporary password: ${seed.temporaryPassword}`)
  console.log('[auth] Admin must change password on first login.')
} else {
  console.log(`[auth] Admin account ready: ${seed.email}`)
}

app.listen(PORT, () => {
  console.log(`[server] MacKnight prospecting API on http://localhost:${PORT}`)
})
