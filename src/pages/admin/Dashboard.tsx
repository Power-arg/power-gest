import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  getDashboardStats,
  getSalesChartData,
  getTopProductsData,
  getPaymentMethodsData,
  getProvidersData,
} from '@/lib/api';
import { DashboardStats, ChartData } from '@/types/admin';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<ChartData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ChartData[]>([]);
  const [providers, setProviders] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, sales, products, payments, provs] = await Promise.all([
          getDashboardStats(),
          getSalesChartData(),
          getTopProductsData(),
          getPaymentMethodsData(),
          getProvidersData(),
        ]);
        setStats(statsData);
        setSalesData(sales);
        setTopProducts(products);
        setPaymentMethods(payments);
        setProviders(provs);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del negocio</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Total Ingresos"
          value={formatCurrency(stats?.totalIngresos ?? 0)}
          icon={DollarSign}
          trend="up"
          trendValue="+12%"
          className="animate-fade-up stagger-1"
        />
        <StatsCard
          title="Total Compras"
          value={formatCurrency(stats?.totalCompras ?? 0)}
          icon={ShoppingBag}
          className="animate-fade-up stagger-2"
        />
        <StatsCard
          title="Ganancia Neta"
          value={formatCurrency(stats?.gananciaNet ?? 0)}
          icon={TrendingUp}
          trend="up"
          trendValue="+8%"
          className="animate-fade-up stagger-3"
        />
        <StatsCard
          title="Stock Disponible"
          value={stats?.stockDisponible ?? 0}
          subtitle="unidades"
          icon={Package}
          className="animate-fade-up stagger-4"
        />
        <StatsCard
          title="Ventas Hoy"
          value={formatCurrency(stats?.ventasHoy ?? 0)}
          icon={Calendar}
          className="animate-fade-up stagger-5"
        />
        <StatsCard
          title="Ventas Semana"
          value={formatCurrency(stats?.ventasSemana ?? 0)}
          icon={CalendarDays}
          trend="up"
          trendValue="+15%"
          className="animate-fade-up"
          style={{ animationDelay: '0.6s' }}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales over time */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-display text-lg font-semibold mb-4">Ventas vs Compras</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 50%)" fontSize={12} />
                <YAxis stroke="hsl(0 0% 50%)" fontSize={12} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(0 0% 90%)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="hsl(0 0% 90%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(0 0% 90%)', strokeWidth: 0 }}
                  name="Ventas"
                />
                <Line
                  type="monotone"
                  dataKey="compras"
                  stroke="hsl(0 0% 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(0 0% 50%)', strokeWidth: 0 }}
                  name="Compras"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top products */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-display text-lg font-semibold mb-4">Productos más vendidos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis type="number" stroke="hsl(0 0% 50%)" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(0 0% 50%)" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(0 0% 90%)' }}
                />
                <Bar dataKey="value" fill="hsl(0 0% 80%)" radius={[0, 4, 4, 0]} name="Unidades" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment methods */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-display text-lg font-semibold mb-4">Métodos de pago</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill as string} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Providers */}
        <div className="glass-card p-6 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="font-display text-lg font-semibold mb-4">Proveedores principales</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={providers}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {providers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill as string} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
