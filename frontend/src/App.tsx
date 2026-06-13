import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { StakeholdersPage } from './pages/StakeholdersPage';
import { CreateStakeholderPage } from './pages/CreateStakeholderPage';
import { cn } from '@/lib/utils';

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-primary text-primary-foreground h-[60px] flex items-center justify-between px-8 shadow-lg">
        <span className="text-xl font-semibold tracking-tight">Stakeholder Manager</span>
        <div className="flex gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            Stakeholders
          </NavLink>
          <NavLink
            to="/new"
            className={({ isActive }) =>
              cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            Add Stakeholder
          </NavLink>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-8 py-8">
        <Routes>
          <Route path="/" element={<StakeholdersPage />} />
          <Route path="/new" element={<CreateStakeholderPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
