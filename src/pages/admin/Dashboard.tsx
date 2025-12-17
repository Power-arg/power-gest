import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import {
  getDashboardStats,
  getSalesChartData,
  getTopBrandsData,
  getPaymentMethodsData,
  getClientsData,
} from '@/lib/api';
import { DashboardStats, ChartData } from '@/types/admin';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Package,
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
  const [topBrands, setTopBrands] = useState<ChartData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<ChartData[]>([]);
  const [clients, setClients] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, sales, brands, payments, clts] = await Promise.all([
          getDashboardStats(),
          getSalesChartData(),
          getTopBrandsData(),
          getPaymentMethodsData(),
          getClientsData(),
        ]);
        setStats(statsData);
        setSalesData(sales);
        setTopBrands(brands);
        setPaymentMethods(payments);
        setClients(clts);
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Resumen general de power</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Total Ingresos"
          value={formatCurrency(stats?.totalIngresos ?? 0)}
          icon={DollarSign}
          iconColor="text-green-500"
          className="animate-fade-up stagger-1"
        />
        <StatsCard
          title="Total Compras"
          value={formatCurrency(stats?.totalCompras ?? 0)}
          icon={ShoppingBag}
          iconColor="text-red-500"
          className="animate-fade-up stagger-2"
        />
        <StatsCard
          title="Ganancia Neta"
          value={formatCurrency(stats?.gananciaNet ?? 0)}
          icon={TrendingUp}
          iconColor="text-blue-500"
          className="animate-fade-up stagger-3"
        />
        <StatsCard
          title="Stock Disponible"
          value={stats?.stockDisponible ?? 0}
          icon={Package}
          iconColor="text-purple-500"
          className="animate-fade-up stagger-4"
        />
        <StatsCard
          title="Ventas Semana"
          value={formatCurrency(stats?.ventasSemana ?? 0)}
          icon={CalendarDays}
          iconColor="text-orange-500"
          className="animate-fade-up"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Sales over time - Hidden on mobile */}
        <div className="hidden md:block glass-card p-4 md:p-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-display text-base md:text-lg font-semibold mb-4">Ventas vs Compras</h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 50%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 50%)" fontSize={11} tickFormatter={(v) => `$${v/1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(0 0% 90%)' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
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

        {/* Top brands */}
        <div className="glass-card p-4 md:p-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="font-display text-base md:text-lg font-semibold mb-4">Marcas más vendidas</h3>
          {/* Desktop - Vertical bar chart with legend */}
          <div className="hidden md:block h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBrands}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                <XAxis dataKey="name" stroke="hsl(0 0% 50%)" fontSize={11} />
                <YAxis stroke="hsl(0 0% 50%)" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {topBrands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill as string} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Mobile - Pie chart */}
          <div className="md:hidden h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topBrands}
                  cx="50%"
                  cy="40%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {topBrands.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill as string} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                  iconType="circle"
                  formatter={(value, entry: any) => {
                    const total = topBrands.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.payload.value / total) * 100).toFixed(0);
                    return <span style={{ color: 'hsl(0, 0%, 80%)' }}>{value} ({percent}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Payment methods */}
        <div className="glass-card p-4 md:p-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <h3 className="font-display text-base md:text-lg font-semibold mb-4">Métodos de pago</h3>
          {/* Desktop */}
          <div className="hidden md:block h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: '12px' }}
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
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Mobile */}
          <div className="md:hidden h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="40%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
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
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                  iconType="circle"
                  formatter={(value, entry: any) => {
                    const total = paymentMethods.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.payload.value / total) * 100).toFixed(0);
                    return <span style={{ color: 'hsl(0, 0%, 80%)' }}>{value} ({percent}%)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Clients */}
        <div className="glass-card p-4 md:p-6 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <h3 className="font-display text-base md:text-lg font-semibold mb-4">Clientes principales</h3>
          {/* Desktop */}
          <div className="hidden md:block h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clients}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: '12px' }}
                >
                  {clients.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill as string} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Mobile */}
          <div className="md:hidden h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={clients}
                  cx="50%"
                  cy="40%"
                  innerRadius={35}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  label={false}
                >
                  {clients.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill as string} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 10%)',
                    border: '1px solid hsl(0 0% 20%)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'white' }}
                  itemStyle={{ color: 'white' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}
                  iconType="circle"
                  formatter={(value, entry: any) => {
                    const total = clients.reduce((sum, item) => sum + item.value, 0);
                    const percent = ((entry.payload.value / total) * 100).toFixed(0);
                    return <span style={{ color: 'hsl(0, 0%, 80%)' }}>{value} ({percent}%)</span>;
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
