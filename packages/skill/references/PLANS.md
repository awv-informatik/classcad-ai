# PLANS — what a ClassCAD plan enables

The skills, the recipes and the MCP are free; the engine they drive runs under the
signed-in classcad.ch account's plan. The MCP tool `account` reports the account's
live plan, where an app may run and its public access token — its answer wins over
the defaults below. Plans: https://classcad.ch/plans · account (tokens, domains,
seats, downloads): https://classcad.ch/account

## Plans

| | Free | Solo | Pro | Business |
|---|---|---|---|---|
| Use | private use and evaluation | commercial, on one machine | commercial, local and public | commercial, any number of domains, servers |
| A web app runs on | localhost | localhost | localhost + 1 registered domain per seat | localhost + any registered domains, wildcards included |
| Native engine on own servers | — | — | — | yes |
| Exports | STL | STL, STEP, OFB | all | all |
| Live-sharing guests | — | 2 | 16 | 16 |

Every new account gets 14 days of Solo, then Free. Prices and the full comparison
are on the plans page; contracts for larger companies and education are made
individually.

## How an app gets the engine

A web app runs the ClassCAD engine in the browser (WASM). The engine starts only
with a key, and a key only works on the origins the plan allows:

- **localhost** (any port) works on every plan, nothing to register.
- **Public domains** come with Pro and Business: register each under Domains on the account page; Business also allows wildcards (`https://*.example.com`).
- **Servers** (the native engine) come with Business; its key file is under Downloads on the account page.

The app never handles a key itself. It carries a **public access token** (`ccpk_…`),
and the buerli SDK exchanges it for a key and renews it. Tokens are made on the
account page under Access tokens. Public tokens go into web pages; secret tokens
(`ccsk_…`) only onto servers and CI, never into a page.

How to put the token into an app: https://classcad.ch/docs/wasm/ — the buerli
SDK itself: https://buerli.io/docs/

## When the engine does not start

The page reports that the connection to ClassCAD failed; the browser console says
why. Most often the page runs on an origin the plan does not cover (public domain
on Free or Solo), or on a domain not yet registered on the account.
