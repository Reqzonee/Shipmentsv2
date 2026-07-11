import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CreateActionPage } from './pages/CreateActionPage';
import { ActionDetailPage } from './pages/ActionDetailPage';
import { ContactsPage } from './pages/ContactsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="create" element={<CreateActionPage />} />
          <Route path="actions/:actionId" element={<ActionDetailPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
