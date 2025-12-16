import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { FormDialog } from '@/components/admin/FormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { Venta, StockItem } from '@/types/admin';
import { getVentas, createVenta, updateVenta, deleteVenta, getStock } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const metodoPagoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  mercadopago: 'MercadoPago',
};

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    producto: '',
    proveedor: '',
    precioUnitarioVenta: '',
    cantidad: '',
    cliente: '',
    metodoPago: 'efectivo' as Venta['metodoPago'],
    isPagado: true,
    usuarioACargo: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const fetchVentas = async () => {
    try {
      const data = await getVentas();
      setVentas(data);
    } finally {
      setLoading(false);
    }
  };

  const fetchStock = async () => {
    try {
      const data = await getStock();
      setStock(data);
    } catch (error) {
      toast({ title: 'Error al cargar stock', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchStock();
  }, []);

  const resetForm = () => {
    setFormData({
      producto: '',
      proveedor: '',
      precioUnitarioVenta: '',
      cantidad: '',
      cliente: '',
      metodoPago: 'efectivo',
      isPagado: true,
      usuarioACargo: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setEditingVenta(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (venta: Venta) => {
    setEditingVenta(venta);
    setFormData({
      producto: venta.producto,
      proveedor: venta.proveedor,
      precioUnitarioVenta: venta.precioUnitarioVenta.toString(),
      cantidad: venta.cantidad.toString(),
      cliente: venta.cliente,
      metodoPago: venta.metodoPago,
      isPagado: venta.isPagado,
      usuarioACargo: venta.usuarioACargo,
      fecha: venta.fecha,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (venta: Venta) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
    try {
      await deleteVenta(venta.id);
      toast({ title: 'Venta eliminada' });
      fetchVentas();
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleProductSelect = (productKey: string) => {
    const selectedStock = stock.find(s => s.id === productKey);
    if (selectedStock) {
      setFormData({
        ...formData,
        producto: selectedStock.producto,
        proveedor: selectedStock.proveedor,
        precioUnitarioVenta: selectedStock.precioUnitarioVenta.toString(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const ventaData = {
        producto: formData.producto,
        proveedor: formData.proveedor,
        precioUnitarioVenta: parseFloat(formData.precioUnitarioVenta),
        cantidad: parseInt(formData.cantidad),
        cliente: formData.cliente,
        metodoPago: formData.metodoPago,
        isPagado: formData.isPagado,
        usuarioACargo: formData.usuarioACargo,
        fecha: formData.fecha,
      };

      if (editingVenta) {
        await updateVenta(editingVenta.id, ventaData);
        toast({ title: 'Venta actualizada' });
      } else {
        await createVenta(ventaData);
        toast({ title: 'Venta creada' });
      }

      setDialogOpen(false);
      resetForm();
      fetchVentas();
      fetchStock(); // Actualizar stock después de crear/editar venta
    } catch {
      toast({ title: 'Error al guardar', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'producto', label: 'Producto' },
    { key: 'proveedor', label: 'Proveedor' },
    {
      key: 'precioUnitarioVenta',
      label: 'Precio Unit.',
      render: (v: Venta) => formatCurrency(v.precioUnitarioVenta),
    },
    { key: 'cantidad', label: 'Cant.' },
    {
      key: 'total',
      label: 'Total',
      render: (v: Venta) => formatCurrency(v.precioUnitarioVenta * v.cantidad),
    },
    { key: 'cliente', label: 'Cliente' },
    {
      key: 'metodoPago',
      label: 'Método',
      render: (v: Venta) => metodoPagoLabels[v.metodoPago],
    },
    {
      key: 'isPagado',
      label: 'Estado',
      render: (v: Venta) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            v.isPagado
              ? 'bg-success/20 text-success'
              : 'bg-warning/20 text-warning'
          }`}
        >
          {v.isPagado ? 'Pagado' : 'Pendiente'}
        </span>
      ),
    },
    { key: 'usuarioACargo', label: 'Usuario' },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (v: Venta) => formatDate(v.fecha),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filtrar solo productos con stock disponible
  const availableStock = stock.filter(s => s.cantidadTotal > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Ventas</h1>
          <p className="text-muted-foreground">Gestiona las ventas de stock</p>
        </div>
        <Button onClick={handleOpenCreate} className="admin-button gap-2">
          <Plus className="h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={ventas}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchKey="producto"
        />
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingVenta ? 'Editar Venta' : 'Nueva Venta'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingVenta && (
            <div className="space-y-2">
              <Label htmlFor="productoSelect">Seleccionar Producto del Stock</Label>
              <Select onValueChange={handleProductSelect}>
                <SelectTrigger className="admin-input">
                  <SelectValue placeholder="Selecciona un producto..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStock.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No hay productos con stock disponible
                    </div>
                  ) : (
                    availableStock.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.producto} - {item.proveedor} (Stock: {item.cantidadTotal}) - {formatCurrency(item.precioUnitarioVenta)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="producto">Producto</Label>
              <Input
                id="producto"
                value={formData.producto}
                onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                className="admin-input"
                readOnly={!editingVenta}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Input
                id="proveedor"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                className="admin-input"
                readOnly={!editingVenta}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio Unitario</Label>
              <Input
                id="precio"
                type="number"
                value={formData.precioUnitarioVenta}
                onChange={(e) => setFormData({ ...formData, precioUnitarioVenta: e.target.value })}
                className="admin-input"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                type="number"
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                className="admin-input"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuarioACargo">Usuario a Cargo</Label>
              <Input
                id="usuarioACargo"
                value={formData.usuarioACargo}
                onChange={(e) => setFormData({ ...formData, usuarioACargo: e.target.value })}
                className="admin-input"
                placeholder="Nombre del responsable"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metodoPago">Método de Pago</Label>
              <Select
                value={formData.metodoPago}
                onValueChange={(value) =>
                  setFormData({ ...formData, metodoPago: value as Venta['metodoPago'] })
                }
              >
                <SelectTrigger className="admin-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="admin-input"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Switch
              id="isPagado"
              checked={formData.isPagado}
              onCheckedChange={(checked) => setFormData({ ...formData, isPagado: checked })}
            />
            <Label htmlFor="isPagado">Pagado</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="admin-button-outline"
            >
              Cancelar
            </Button>
            <Button type="submit" className="admin-button" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVenta ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </FormDialog>
    </div>
  );
}
