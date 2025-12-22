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
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Venta } from '@/types/admin';
import { getVentas, createVenta, updateVenta, deleteVenta, getProductos } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const metodoPagoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
};

export default function Ventas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [productos, setProductos] = useState<{ producto: string; proveedor: string; marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition'; stockDisponible: number; precioUnitarioVenta: number }[]>([]);
  const [stockDisponible, setStockDisponible] = useState<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState<Venta | null>(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition'>('ENA');

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
      // Ordenar por fecha de más reciente a más antigua
      const sorted = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setVentas(sorted);
    } catch (error: any) {
      toast({ title: 'Error al cargar ventas', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    try {
      const data = await getProductos();
      setProductos(data);
    } catch (error: any) {
      toast({ title: 'Error al cargar productos', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchVentas();
    fetchProductos();
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
    setStockDisponible(0);
    setMarcaSeleccionada('ENA');
    setEditingVenta(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    fetchProductos();
    setDialogOpen(true);
  };

  const handleProductoProveedorChange = (productoProveedor: string) => {
    const selected = productos.find(p => `${p.producto}|||${p.proveedor}` === productoProveedor);
    if (selected) {
      setFormData({
        ...formData,
        producto: selected.producto,
        proveedor: selected.proveedor,
        precioUnitarioVenta: selected.precioUnitarioVenta.toString(),
      });
      setStockDisponible(selected.stockDisponible);
      setMarcaSeleccionada(selected.marca);
    }
  };

  const handleEdit = (venta: Venta) => {
    setEditingVenta(venta);
    const producto = productos.find(p => p.producto === venta.producto && p.proveedor === venta.proveedor);
    if (producto) {
      setMarcaSeleccionada(producto.marca);
    }
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

  const handleDeleteClick = (venta: Venta) => {
    setVentaToDelete(venta);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!ventaToDelete) return;
    try {
      await deleteVenta(ventaToDelete.id);
      toast({ title: 'Venta eliminada' });
      fetchVentas();
      fetchProductos();
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setVentaToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validaciones
      if (!formData.producto || !formData.proveedor || !formData.precioUnitarioVenta || !formData.cantidad || !formData.cliente || !formData.usuarioACargo) {
        toast({ title: 'Todos los campos son requeridos', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      const cantidad = parseInt(formData.cantidad);
      if (!editingVenta && cantidad > stockDisponible) {
        toast({ 
          title: 'Stock insuficiente', 
          description: `Stock disponible: ${stockDisponible}`,
          variant: 'destructive' 
        });
        setSubmitting(false);
        return;
      }

      const ventaData = {
        producto: formData.producto,
        proveedor: formData.proveedor,
        precioUnitarioVenta: parseFloat(formData.precioUnitarioVenta),
        cantidad: cantidad,
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
      fetchProductos();
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const marcaColors: Record<string, string> = {
    'ENA': 'bg-blue-500 text-white',
    'Star': 'bg-green-500 text-white',
    'Body Advance': 'bg-red-500 text-white',
    'Gentech': 'bg-blue-900 text-white',
    'GoldNutrition': 'bg-yellow-500 text-black',
    'Growsbar': 'bg-gray-600 text-white',
    'Crudda': 'bg-orange-500 text-white',
    'Otro': 'bg-gray-300 text-black',
  };

  const columns = [
    { 
      key: 'producto', 
      label: 'Producto',
      render: (v: Venta) => {
        const producto = productos.find(p => p.producto === v.producto && p.proveedor === v.proveedor);
        return (
          <div className="flex items-center gap-2 flex-wrap">
            <span>{v.producto}</span>
            {producto && (
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${marcaColors[producto.marca]}`}>
                {producto.marca}
              </span>
            )}
          </div>
        );
      },
    },
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
    { key: 'usuarioACargo', label: 'Usuario' },
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
    { key: 'fecha', label: 'Fecha' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Ventas</h1>
          <p className="text-muted-foreground text-sm">Gestiona las ventas de stock</p>
        </div>
        <Button onClick={handleOpenCreate} className="admin-button gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nueva Venta
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={ventas}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          searchKey="producto"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {ventas.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            No hay ventas registradas
          </div>
        ) : (
          ventas.map((venta) => {
            const producto = productos.find(p => p.producto === venta.producto && p.proveedor === venta.proveedor);
            return (
              <div key={venta.id} className="glass-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{venta.producto}</h3>
                      {producto && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${marcaColors[producto.marca]}`}>
                          {producto.marca}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{venta.proveedor}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        venta.isPagado
                          ? 'bg-success/20 text-success'
                          : 'bg-warning/20 text-warning'
                      }`}>
                        {venta.isPagado ? 'Pagado' : 'Pendiente'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {metodoPagoLabels[venta.metodoPago]}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(venta)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(venta)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cliente</p>
                    <p className="font-medium text-foreground">{venta.cliente}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Usuario</p>
                    <p className="font-medium text-foreground">{venta.usuarioACargo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Precio Unit.</p>
                    <p className="font-medium text-foreground">{formatCurrency(venta.precioUnitarioVenta)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cantidad</p>
                    <p className="font-medium text-foreground">{venta.cantidad}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold text-foreground">{formatCurrency(venta.precioUnitarioVenta * venta.cantidad)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fecha</p>
                    <p className="font-medium text-foreground">{venta.fecha}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingVenta ? 'Editar Venta' : 'Nueva Venta'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingVenta && (
            <div className="space-y-2">
              <Label htmlFor="productoProveedor">Producto - Proveedor</Label>
              <Select
                value={formData.producto && formData.proveedor ? `${formData.producto}|||${formData.proveedor}` : ''}
                onValueChange={handleProductoProveedorChange}
              >
                <SelectTrigger className="admin-input">
                  <SelectValue placeholder="Selecciona producto y proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((p) => (
                    <SelectItem key={`${p.producto}|||${p.proveedor}`} value={`${p.producto}|||${p.proveedor}`}>
                      {p.producto} - {p.proveedor} (Stock: {p.stockDisponible})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {editingVenta && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <Input
                  value={formData.producto}
                  className="admin-input"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Input
                  value={formData.proveedor}
                  className="admin-input"
                  disabled
                />
              </div>
            </div>
          )}

          {stockDisponible > 0 && !editingVenta && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Stock disponible:</strong> {stockDisponible} unidades
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio Unitario</Label>
              <Input
                id="precio"
                type="number"
                value={formData.precioUnitarioVenta}
                onChange={(e) => setFormData({ ...formData, precioUnitarioVenta: e.target.value })}
                className="admin-input"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="transferencia">Transferencia</SelectItem>
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

          <div className="flex items-center gap-3">
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la venta de <strong>{ventaToDelete?.producto}</strong> del proveedor <strong>{ventaToDelete?.proveedor}</strong> al cliente <strong>{ventaToDelete?.cliente}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
