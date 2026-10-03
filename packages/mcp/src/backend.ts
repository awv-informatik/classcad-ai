// backend.ts — which ClassCAD backend the MCP signs in to and gets its engine keys from.
//
//   classcad (default)  the plans backend (Firebase project classcad-app); sign-in on classcad.ch
//   develop             the same backend, signed in on a develop build of classcad.ch
//                       (http://localhost:9090), for trying the sites and the MCP together
//   staging             the same backend, signed in on https://staging01.classcad.ch
//
// CLASSCAD_BACKEND picks one; CLASSCAD_AUTH_PROJECT, CLASSCAD_AUTH_API_KEY, CLASSCAD_AUTH_URL and
// CLASSCAD_KEY_URL still override single values (tests point them at stand-ins).

type Backend = { project: string; apiKey: string; loginUrl: string; keyUrl: string }

const classcad: Backend = {
  project: 'classcad-app',
  // The project's public web API key (the one classcad.ch ships)
  apiKey: 'AIzaSyA3emzV1j-4WrUduiQ9JJuRGhrR1MNWiqY',
  loginUrl: 'https://classcad.ch/connect',
  keyUrl: 'https://europe-west1-classcad-app.cloudfunctions.net/api/v1/key',
}

const BACKENDS: Record<string, Backend> = {
  classcad,
  develop: { ...classcad, loginUrl: 'http://localhost:9090/connect' },
  staging: { ...classcad, loginUrl: 'https://staging01.classcad.ch/connect' },
}

export const BACKEND_NAME = BACKENDS[process.env.CLASSCAD_BACKEND ?? ''] ? (process.env.CLASSCAD_BACKEND as string) : 'classcad'
const backend = BACKENDS[BACKEND_NAME]

export const AUTH_PROJECT = process.env.CLASSCAD_AUTH_PROJECT || backend.project
export const AUTH_API_KEY = process.env.CLASSCAD_AUTH_API_KEY || backend.apiKey
export const AUTH_URL = process.env.CLASSCAD_AUTH_URL || backend.loginUrl
/** The token exchange: a sign-in or an access token in, an engine key out. */
export const KEY_URL = process.env.CLASSCAD_KEY_URL || backend.keyUrl
