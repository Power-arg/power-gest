import { NavLink } from '@/components/NavLink';
import { LayoutDashboard, ShoppingCart, Package, Boxes } from 'lucide-react';

interface SidebarProps {
  onItemClick?: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
  { icon: Package, label: 'Compras', path: '/compras' },
  { icon: Boxes, label: 'Stock', path: '/stock' },
];

export function Sidebar({ onItemClick }: SidebarProps) {
  return (
    <nav className="p-4 space-y-2">
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className="sidebar-item"
          activeClassName="sidebar-item-active"
          onClick={onItemClick}
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
