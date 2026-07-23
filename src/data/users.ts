export type DemoUser = {
  username: string
  password: string
  name: string
  title: string
}

/**
 * Demo credential store. This is a client-side stand-in for a real auth
 * backend — swap for an SSO / identity provider when wiring to production.
 */
export const USERS: DemoUser[] = [
  { username: 'dwhitfield', password: 'safety123', name: 'Dana Whitfield', title: 'Business Development' },
  { username: 'mlee', password: 'safety123', name: 'Marcus Lee', title: 'Staffing Lead' },
  { username: 'jrivera', password: 'safety123', name: 'Jordan Rivera', title: 'Account Manager' },
]
