import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/create', label: 'Create Action' },
  { to: '/entities', label: 'CRM Entities' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-slate-200/80 bg-ink-950 text-white lg:border-b-0 lg:border-r lg:border-ink-800">
        <div className="px-6 py-7">
          <p className="font-display text-2xl tracking-tight">Shipmnts</p>
          <p className="mt-1 text-sm text-slate-400">Bulk Action Platform</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <a
            href="http://localhost:3000/docs"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Swagger Docs ↗
          </a>
        </nav>
      </aside>

      <main className="px-4 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
