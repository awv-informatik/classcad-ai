// JS-side timeout so a server hang becomes a visible result instead of wedging the harness indefinitely.
// NOTE: the timeout only unblocks the CLIENT — a hung worker stays wedged server-side and must be restarted.
export function withTimeout(promise, ms, label = 'call') {
  return Promise.race([
    Promise.resolve(promise).then(r => ({ hung: false, r })),
    new Promise(res => setTimeout(() => res({ hung: true, label, ms }), ms)),
  ])
}
