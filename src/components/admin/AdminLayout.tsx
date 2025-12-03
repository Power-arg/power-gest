import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Menu, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoIcon from '@/assets/logo-power-icon.png';

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img 
              src={logoIcon} 
              alt="Power" 
              className="w-10 h-10 invert"
            />
            <div>
              <h1 className="font-display text-lg font-bold text-sidebar-foreground tracking-wide">POWER</h1>
              <p className="text-xs text-muted-foreground">Admin System</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <Sidebar onItemClick={() => setSidebarOpen(false)} />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Panel Administrativo</p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
