import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { StockItem } from '@/types/admin';
import { getStock } from '@/lib/api';
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

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

  const columns = [
    { key: 'producto', label: 'Producto' },
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
        const isLow = s.cantidadTotal <= 5;
        const isNegative = s.cantidadTotal < 0;
        return (
          <div className="flex items-center gap-2">
            {isNegative ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : isLow ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            <span
              className={`font-semibold ${
                isNegative
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
        const isLow = s.cantidadTotal <= 5 && s.cantidadTotal > 0;
        const isOut = s.cantidadTotal <= 0;
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
  const lowStockCount = stock.filter((s) => s.cantidadTotal <= 5 && s.cantidadTotal > 0).length;
  const outOfStockCount = stock.filter((s) => s.cantidadTotal <= 0).length;

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
        <h1 className="font-display text-3xl font-bold mb-1">Stock General</h1>
        <p className="text-muted-foreground">
          Inventario calculado automáticamente desde compras y ventas
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Productos</span>
          </div>
          <p className="text-2xl font-display font-bold">{totalProducts}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Unidades Totales</span>
          </div>
          <p className="text-2xl font-display font-bold">{totalUnits}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span className="text-sm text-muted-foreground">Stock Bajo</span>
          </div>
          <p className="text-2xl font-display font-bold text-warning">{lowStockCount}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Sin Stock</span>
          </div>
          <p className="text-2xl font-display font-bold text-destructive">{outOfStockCount}</p>
        </div>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <DataTable data={stock} columns={columns} searchKey="producto" />
      </div>
    </div>
  );
}
