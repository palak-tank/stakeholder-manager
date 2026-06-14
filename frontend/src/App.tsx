import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { DashboardPage } from './pages/DashboardPage';
import { StakeholdersPage } from './pages/StakeholdersPage';
import { CreateStakeholderPage } from './pages/CreateStakeholderPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppSidebar } from './components/AppSidebar';
import { AuthProvider } from './context/AuthContext';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 px-4 border-b md:hidden">
          <SidebarTrigger />
          <span className="font-semibold text-sm">Stakeholder Manager</span>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stakeholders" element={<StakeholdersPage />} />
          <Route path="/stakeholders/new" element={<CreateStakeholderPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster richColors position="top-center" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
