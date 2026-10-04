// backend.ts — which ClassCAD backend the MCP signs in to, gets its engine keys from, and shares
// sessions on.
//
//   classcad (default)  the plans backend (Firebase project classcad-app); sign-in on classcad.ch;
//                       sessions on the relay (classcad-share)
//   develop             the same backend, signed in on a develop build of classcad.ch
//                       (http://localhost:9090), for trying the sites and the MCP together;
//                       sessions on the develop relay (classcad-share-develop)
//   staging             the same backend, signed in on https://staging01.classcad.ch; the develop relay
//
// CLASSCAD_BACKEND picks one; CLASSCAD_AUTH_PROJECT, CLASSCAD_AUTH_API_KEY, CLASSCAD_AUTH_URL and
// CLASSCAD_KEY_URL still override single values (tests point them at stand-ins).

type Backend = { project: string; apiKey: string; loginUrl: string; keyUrl: string; relayUrl: string }

const classcad: Backend = {
  project: 'classcad-app',
  // The project's public web API key (the one classcad.ch ships)
  apiKey: 'AIzaSyA3emzV1j-4WrUduiQ9JJuRGhrR1MNWiqY',
  loginUrl: 'https://classcad.ch/connect',
  keyUrl: 'https://europe-west1-classcad-app.cloudfunctions.net/api/v1/key',
  // packages/relay, `npm run deploy` there
  relayUrl: 'https://classcad-share.it-5ca.workers.dev',
}

// packages/relay, `npm run deploy:develop` there, from the develop branch: develop work never runs on
// the relay that users share on
const DEVELOP_RELAY_URL = 'https://classcad-share-develop.it-5ca.workers.dev'

const BACKENDS: Record<string, Backend> = {
  classcad,
  develop: { ...classcad, loginUrl: 'http://localhost:9090/connect', relayUrl: DEVELOP_RELAY_URL },
  staging: { ...classcad, loginUrl: 'https://staging01.classcad.ch/connect', relayUrl: DEVELOP_RELAY_URL },
}

export const BACKEND_NAME = BACKENDS[process.env.CLASSCAD_BACKEND ?? ''] ? (process.env.CLASSCAD_BACKEND as string) : 'classcad'
const backend = BACKENDS[BACKEND_NAME]

export const AUTH_PROJECT = process.env.CLASSCAD_AUTH_PROJECT || backend.project
export const AUTH_API_KEY = process.env.CLASSCAD_AUTH_API_KEY || backend.apiKey
export const AUTH_URL = process.env.CLASSCAD_AUTH_URL || backend.loginUrl
/** The token exchange: a sign-in or an access token in, an engine key out. */
export const KEY_URL = process.env.CLASSCAD_KEY_URL || backend.keyUrl
/** The relay sessions are shared on, unless CLASSCAD_RELAY_URL names another (share/relay.ts). */
export const RELAY_URL = backend.relayUrl
