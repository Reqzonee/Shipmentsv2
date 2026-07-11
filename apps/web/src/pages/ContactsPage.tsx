import { type FormEvent, useEffect, useState } from 'react';
import { api, type Contact } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [seedCount, setSeedCount] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const res = await api.listContacts({
        page: nextPage,
        limit,
        status: status || undefined,
        q: q || undefined,
        minAge: minAge || undefined,
        maxAge: maxAge || undefined,
      });
      setContacts(res.data?.data ?? []);
      setTotal(res.data?.pagination.total ?? 0);
      setTotalPages(res.data?.pagination.totalPages ?? 1);
      setPage(res.data?.pagination.page ?? nextPage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q, minAge, maxAge, limit]);

  async function seed() {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await api.seedContacts(seedCount);
      setMessage(
        `Added ${res.data?.inserted ?? 0} fake contacts (about 1/3 each: active, inactive, lead).`
      );
      await load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  }

  function applySearch(e: FormEvent) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-950">Contacts</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Fake CRM people used to test bulk updates. <strong>2,000</strong> just means
            “create 2,000 sample rows” so the queue has real volume — not a special limit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto"
            value={seedCount}
            onChange={(e) => setSeedCount(Number(e.target.value))}
          >
            <option value={500}>Seed 500</option>
            <option value={2000}>Seed 2,000</option>
            <option value={5000}>Seed 5,000</option>
          </select>
          <button
            type="button"
            onClick={seed}
            disabled={seeding}
            className="rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-60"
          >
            {seeding ? 'Seeding…' : 'Add sample contacts'}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-panel">
        <h2 className="text-sm font-semibold text-ink-900">What do statuses mean?</h2>
        <ul className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
          <li>
            <StatusBadge status="active" /> — customer is engaged / usable
          </li>
          <li>
            <StatusBadge status="inactive" /> — paused / not currently engaged
          </li>
          <li>
            <StatusBadge status="lead" /> — potential customer, not converted yet
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Bulk update example: filter <em>inactive</em> → set to <em>active</em> (wake up
          many people at once).
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-panel">
        <form
          onSubmit={applySearch}
          className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto]"
        >
          <input
            className="input"
            placeholder="Search name or email…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="lead">lead</option>
          </select>
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Min age"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
          />
          <input
            className="input"
            type="number"
            min={0}
            placeholder="Max age"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            Search
          </button>
        </form>
      </section>

      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ·{' '}
            <strong>{total}</strong> matching contacts
          </span>
          <label className="flex items-center gap-2">
            Rows
            <select
              className="input w-auto py-1.5"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
        </div>

        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Age</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  No contacts match these filters — seed data or clear filters.
                </td>
              </tr>
            ) : (
              contacts.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3 font-medium text-ink-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{c.age}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm tabular-nums text-slate-500">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => load(page + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </section>
    </div>
  );
}
