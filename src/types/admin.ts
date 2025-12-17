export interface Venta {
  id: string;
  producto: string;
  proveedor: string;
  precioUnitarioVenta: number;
  cantidad: number;
  cliente: string;
  metodoPago: 'efectivo' | 'transferencia';
  isPagado: boolean;
  usuarioACargo: string;
  fecha: string;
}

export interface Compra {
  id: string;
  producto: string;
  proveedor: string;
  marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Otro';
  precioUnitarioCompra: number;
  cantidad: number;
  fecha: string;
}

export interface StockItem {
  id: string;
  producto: string;
  proveedor: string;
  marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Otro';
  precioUnitarioVenta: number;
  cantidadVendida: number;
  cantidadComprada: number;
  cantidadTotal: number;
}

export interface DashboardStats {
  totalIngresos: number;
  totalCompras: number;
  gananciaNet: number;
  stockDisponible: number;
  ventasHoy: number;
  ventasSemana: number;
  ingresosPercentChange: number;
  gananciaPercentChange: number;
}

export interface ChartData {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}
