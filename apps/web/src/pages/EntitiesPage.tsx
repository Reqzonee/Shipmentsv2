import { type FormEvent, useEffect, useState } from 'react';
import { api, type EntityMeta, type EntityRecord } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

export function EntitiesPage() {
  const [entities, setEntities] = useState<EntityMeta[]>([]);
  const [entityType, setEntityType] = useState('contact');
  const [accountId, setAccountId] = useState('acc_demo');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [rows, setRows] = useState<EntityRecord[]>([]);
  const [seedCount, setSeedCount] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = entities.find((e) => e.type === entityType);
  const statusEnums =
    current?.fields.find((f) => f.key === 'status')?.enumValues ?? [];

  useEffect(() => {
    api.listEntities().then((res) => {
      setEntities(res.data ?? []);
      if (res.data?.[0]) setEntityType(res.data[0].type);
    });
  }, []);

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const res = await api.listEntityRecords(entityType, {
        accountId,
        page: nextPage,
        limit,
        status,
        q,
      });
      setRows(res.data?.data ?? []);
      setTotal(res.data?.pagination.total ?? 0);
      setTotalPages(res.data?.pagination.totalPages ?? 1);
      setPage(res.data?.pagination.page ?? nextPage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!entityType) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, accountId, status, q, limit]);

  async function seedOne() {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await api.seedEntity(entityType, seedCount, accountId);
      setMessage(`Seeded ${res.data?.inserted ?? 0} ${current?.collectionLabel ?? entityType}`);
      await load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed');
    } finally {
      setSeeding(false);
    }
  }

  async function seedAll() {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await api.seedAll(seedCount, accountId);
      const parts = Object.entries(res.data?.results ?? {})
        .map(([k, v]) => `${k}:${v}`)
        .join(', ');
      setMessage(`Seeded all entities (${seedCount} each): ${parts}`);
      await load(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed-all failed');
    } finally {
      setSeeding(false);
    }
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setQ(searchInput.trim());
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink-950">CRM entities</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Contacts, Companies, Leads, Opportunities, Tasks — seed thousands for load
            tests (thousands/minute target).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="input w-auto"
            value={seedCount}
            onChange={(e) => setSeedCount(Number(e.target.value))}
          >
            <option value={500}>500</option>
            <option value={2000}>2,000</option>
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
          </select>
          <button
            type="button"
            disabled={seeding}
            onClick={seedOne}
            className="rounded-lg bg-ink-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Seed this entity
          </button>
          <button
            type="button"
            disabled={seeding}
            onClick={seedAll}
            className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Seed ALL entities
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {entities.map((e) => (
          <button
            key={e.type}
            type="button"
            onClick={() => {
              setEntityType(e.type);
              setStatus('');
              setQ('');
              setSearchInput('');
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              entityType === e.type
                ? 'bg-accent text-white'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {e.collectionLabel}
          </button>
        ))}
      </div>

      <form
        onSubmit={onSearch}
        className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-panel md:grid-cols-[1fr_180px_140px_auto]"
      >
        <input
          className="input"
          placeholder="Search name or email…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <input
          className="input"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="accountId"
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {statusEnums.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </form>

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
            {current?.collectionLabel}: page {page}/{totalPages} · {total} total
          </span>
          <select
            className="input w-auto py-1.5"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Extra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No rows — seed this entity.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td className="px-4 py-3 font-medium">{String(r.name ?? '—')}</td>
                    <td className="px-4 py-3 text-slate-600">{String(r.email ?? '—')}</td>
                    <td className="px-4 py-3">
                      {r.status ? <StatusBadge status={String(r.status)} /> : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {extraFields(r, entityType)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => load(page + 1)}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      </section>
    </div>
  );
}

function extraFields(r: EntityRecord, entityType: string): string {
  if (entityType === 'contact') return `age=${String(r.age ?? '')}`;
  if (entityType === 'company') return `industry=${String(r.industry ?? '')}`;
  if (entityType === 'lead') return `source=${String(r.source ?? '')}`;
  if (entityType === 'opportunity') return `amount=${String(r.amount ?? '')}`;
  if (entityType === 'task') return `priority=${String(r.priority ?? '')}`;
  return '';
}
