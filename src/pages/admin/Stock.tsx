import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { StatsCard } from '@/components/admin/StatsCard';
import { StockItem } from '@/types/admin';
import { getStock } from '@/lib/api';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export default function Stock() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const data = await getStock();
        setStock(data);
      } finally {
        setLoading(false);
      }
    };
    fetchStock();
  }, []);

  const marcaColors: Record<string, string> = {
    'ENA': 'bg-blue-500 text-white',
    'Star': 'bg-green-500 text-white',
    'Body Advance': 'bg-red-500 text-white',
    'Gentech': 'bg-blue-900 text-white',
    'GoldNutrition': 'bg-yellow-500 text-black',
  };

  const columns = [
    { 
      key: 'producto', 
      label: 'Producto',
      render: (s: StockItem) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span>{s.producto}</span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${marcaColors[s.marca]}`}>
            {s.marca}
          </span>
        </div>
      ),
    },
    { key: 'proveedor', label: 'Proveedor' },
    {
      key: 'precioUnitarioVenta',
      label: 'Precio Venta',
      render: (s: StockItem) =>
        s.precioUnitarioVenta > 0 ? formatCurrency(s.precioUnitarioVenta) : '-',
    },
    {
      key: 'cantidadComprada',
      label: 'Comprado',
      render: (s: StockItem) => (
        <span className="text-muted-foreground">{s.cantidadComprada}</span>
      ),
    },
    {
      key: 'cantidadVendida',
      label: 'Vendido',
      render: (s: StockItem) => (
        <span className="text-muted-foreground">{s.cantidadVendida}</span>
      ),
    },
    {
      key: 'cantidadTotal',
      label: 'Stock Actual',
      render: (s: StockItem) => {
        const isLow = s.cantidadTotal >= 1 && s.cantidadTotal <= 2;
        const isOut = s.cantidadTotal === 0;
        return (
          <div className="flex items-center gap-2">
            {isOut ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : isLow ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            <span
              className={`font-semibold ${
                isOut
                  ? 'text-destructive'
                  : isLow
                  ? 'text-warning'
                  : 'text-success'
              }`}
            >
              {s.cantidadTotal}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      render: (s: StockItem) => {
        const isLow = s.cantidadTotal >= 1 && s.cantidadTotal <= 2;
        const isOut = s.cantidadTotal === 0;
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOut
                ? 'bg-destructive/20 text-destructive'
                : isLow
                ? 'bg-warning/20 text-warning'
                : 'bg-success/20 text-success'
            }`}
          >
            {isOut ? 'Sin Stock' : isLow ? 'Bajo' : 'Disponible'}
          </span>
        );
      },
    },
  ];

  // Summary stats
  const totalProducts = stock.length;
  const totalUnits = stock.reduce((acc, s) => acc + Math.max(0, s.cantidadTotal), 0);
  const lowStockCount = stock.filter((s) => s.cantidadTotal >= 1 && s.cantidadTotal <= 2).length;
  const outOfStockCount = stock.filter((s) => s.cantidadTotal === 0).length;

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
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Stock General</h1>
        <p className="text-muted-foreground text-sm">
          Inventario calculado automáticamente
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Productos"
          value={totalProducts}
          icon={Package}
          iconColor="text-purple-500"
          className="animate-fade-up stagger-1"
        />
        <StatsCard
          title="Unidades"
          value={totalUnits}
          icon={CheckCircle}
          iconColor="text-green-500"
          className="animate-fade-up stagger-2"
        />
        <StatsCard
          title="Stock Bajo"
          value={lowStockCount}
          icon={AlertTriangle}
          iconColor="text-warning"
          className="animate-fade-up stagger-3"
        />
        <StatsCard
          title="Sin Stock"
          value={outOfStockCount}
          icon={XCircle}
          iconColor="text-red-500"
          className="animate-fade-up stagger-4"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <DataTable data={stock} columns={columns} searchKey="producto" />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {stock.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            No hay productos en stock
          </div>
        ) : (
          stock.map((item) => {
            const isLow = item.cantidadTotal >= 1 && item.cantidadTotal <= 2;
            const isOut = item.cantidadTotal === 0;
            return (
              <div key={item.id} className="glass-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{item.producto}</h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${marcaColors[item.marca]}`}>
                        {item.marca}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.proveedor}</p>
                    <div className="flex items-center gap-2">
                      {isOut ? (
                        <XCircle className="h-4 w-4 text-destructive" />
                      ) : isLow ? (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isOut
                          ? 'bg-destructive/20 text-destructive'
                          : isLow
                          ? 'bg-warning/20 text-warning'
                          : 'bg-success/20 text-success'
                      }`}>
                        {isOut ? 'Sin Stock' : isLow ? 'Bajo' : 'Disponible'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${
                      isOut
                        ? 'text-destructive'
                        : isLow
                        ? 'text-warning'
                        : 'text-success'
                    }`}>
                      {item.cantidadTotal}
                    </span>
                    <p className="text-xs text-muted-foreground">unidades</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm pt-2 border-t border-border/50">
                  <div>
                    <p className="text-muted-foreground text-xs">Comprado</p>
                    <p className="font-medium text-foreground">{item.cantidadComprada}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vendido</p>
                    <p className="font-medium text-foreground">{item.cantidadVendida}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Precio Venta</p>
                    <p className="font-medium text-foreground">
                      {item.precioUnitarioVenta > 0 ? formatCurrency(item.precioUnitarioVenta) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
