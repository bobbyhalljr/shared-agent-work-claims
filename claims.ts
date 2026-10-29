import { randomUUID } from 'node:crypto';
export type Ticket = Readonly<{
  resource: string; owner: string; id: string; fence: number;
  baseRevision: number; expiresAt: number;
}>;
type Cell = { value: string; revision: number; fence: number; active?: Ticket };
function text(s: unknown): asserts s is string {
  if (typeof s !== 'string' || !s.trim()) throw Error('invalid text');
}
// A cooperative single-process example. No authentication or distributed lock.
export class WorkClaims {
  #cells = new Map<string, Cell>();
  #now: () => number;
  constructor(now: () => number = Date.now) { this.#now = now; }
  create(resource: string, value: string) {
    text(resource); if (typeof value !== 'string') throw Error('invalid value');
    if (this.#cells.has(resource)) throw Error('already exists');
    this.#cells.set(resource, { value, revision: 0, fence: 0 });
  }
  #cell(resource: string) {
    const c = this.#cells.get(resource); if (!c) throw Error('unknown resource'); return c;
  }
  read(resource: string) {
    const c = this.#cell(resource); return { value: c.value, revision: c.revision };
  }
  claim(resource: string, owner: string, ttlMs = 1000): Ticket {
    text(owner);
    if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0 || ttlMs > 60_000) throw Error('invalid lifetime');
    const c = this.#cell(resource);
    if (c.active && this.#now() < c.active.expiresAt) throw Error('busy');
    const ticket = Object.freeze({ resource, owner, id: randomUUID(), fence: ++c.fence,
      baseRevision: c.revision, expiresAt: this.#now() + ttlMs });
    c.active = ticket; return ticket;
  }
  #current(ticket: Ticket, owner: string): Cell {
    const c = this.#cell(ticket.resource); const a = c.active;
    if (!a || owner !== a.owner || ticket.owner !== a.owner || ticket.id !== a.id ||
      ticket.fence !== a.fence || ticket.baseRevision !== a.baseRevision ||
      ticket.expiresAt !== a.expiresAt) throw Error('stale or wrong owner');
    if (this.#now() >= a.expiresAt) throw Error('expired');
    return c;
  }
  commit(ticket: Ticket, owner: string, value: string) {
    if (typeof value !== 'string') throw Error('invalid value');
    const c = this.#current(ticket, owner);
    if (c.revision !== ticket.baseRevision) throw Error('source changed');
    // Synchronous check and write through the same resource owner.
    c.value = value; c.revision++; c.active = undefined;
    return this.read(ticket.resource);
  }
  release(ticket: Ticket, owner: string) {
    const c = this.#current(ticket, owner); c.active = undefined;
  }
  // Simulate an independent human/service edit, outside the claim protocol.
  externalEdit(resource: string, value: string) {
    if (typeof value !== 'string') throw Error('invalid value');
    const c = this.#cell(resource); c.value = value; c.revision++;
  }
}
