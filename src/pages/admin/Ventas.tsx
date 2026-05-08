import { useEffect, useState, useRef } from 'react';
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
import { Plus, Loader2, Pencil, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const [productos, setProductos] = useState<{ producto: string; marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Crudda' | 'Granger' | 'OneFit' | 'Nutremax' | 'Integra' | 'Otro'; stockDisponible: number; precioUnitarioVenta: number }[]>([]);
  const [stockDisponible, setStockDisponible] = useState<number>(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ventaToDelete, setVentaToDelete] = useState<Venta | null>(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Crudda' | 'Granger' | 'OneFit' | 'Nutremax' | 'Integra' | 'Otro'>('ENA');
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [showOnlyNoPagados, setShowOnlyNoPagados] = useState<boolean>(false);
  const [openProducto, setOpenProducto] = useState(false);
  const [productoWidth, setProductoWidth] = useState<number>(0);
  const productoTriggerRef = useRef<HTMLButtonElement>(null);
  const productoListRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    producto: '',
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

  useEffect(() => {
    if (productoTriggerRef.current && openProducto) {
      setProductoWidth(productoTriggerRef.current.offsetWidth);
    }
  }, [openProducto]);

  useEffect(() => {
    if (productoListRef.current) {
      productoListRef.current.scrollTop = 0;
    }
  }, [openProducto, productos]);

  const resetForm = () => {
    setFormData({
      producto: '',
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

  const handleProductoChange = (producto: string) => {
    const selected = productos.find(p => p.producto === producto);
    if (selected) {
      setFormData({
        ...formData,
        producto: selected.producto,
        precioUnitarioVenta: selected.precioUnitarioVenta.toString(),
      });
      setStockDisponible(selected.stockDisponible);
      setMarcaSeleccionada(selected.marca);
    }
    setOpenProducto(false);
  };

  const handleEdit = (venta: Venta) => {
    setEditingVenta(venta);
    const producto = productos.find(p => p.producto === venta.producto);
    if (producto) {
      setMarcaSeleccionada(producto.marca);
    }
    setFormData({
      producto: venta.producto,
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

  // Obtener clientes únicos y sin duplicados (limpios)
  const clientesUnicos = Array.from(
    new Set(ventas.map(v => v.cliente.trim()))
  ).sort();

  // Filtrar ventas según los filtros seleccionados
  const ventasFiltradas = ventas.filter(v => {
    const matchesCliente = selectedCliente === '' || v.cliente.trim() === selectedCliente;
    const matchesPagado = !showOnlyNoPagados || !v.isPagado;
    return matchesCliente && matchesPagado;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validaciones
      if (!formData.producto || !formData.precioUnitarioVenta || !formData.cantidad || !formData.cliente || !formData.usuarioACargo) {
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
    'Granger': 'bg-amber-900 text-white',
    'OneFit': 'bg-red-700 text-white',
    'Nutremax': 'bg-pink-500 text-white',
    'Integra': 'bg-yellow-500 text-black',
    'Otro': 'bg-gray-300 text-black',
  };

  const columns = [
    { 
      key: 'producto', 
      label: 'Producto',
      render: (v: Venta) => {
        const producto = productos.find(p => p.producto === v.producto);
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
          data={ventasFiltradas}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          searchKey="producto"
          filterElement={
            <div className="flex gap-3 items-end">
              <div className="w-60">
                <Select
                  value={selectedCliente || "all"}
                  onValueChange={(value) => setSelectedCliente(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="admin-input">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span>Todos los clientes</span>
                    </SelectItem>
                    {clientesUnicos.map((cliente) => (
                      <SelectItem key={cliente} value={cliente}>
                        {cliente}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={showOnlyNoPagados}
                  onCheckedChange={setShowOnlyNoPagados}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">No pagados</span>
              </div>
            </div>
          }
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {ventasFiltradas.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            No hay ventas registradas
          </div>
        ) : (
          ventasFiltradas.map((venta) => {
            const producto = productos.find(p => p.producto === venta.producto);
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
              <Label htmlFor="producto">Producto</Label>
              <Popover open={openProducto} onOpenChange={setOpenProducto}>
                <PopoverTrigger asChild>
                  <Button
                    ref={productoTriggerRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProducto}
                    className="w-full justify-between admin-input h-10 px-3 py-2"
                  >
                    {formData.producto
                      ? formData.producto
                      : "Selecciona producto..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent style={{ width: productoWidth ? `${productoWidth}px` : 'auto' }} className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar producto..." />
                    <CommandList ref={productoListRef} className="overflow-y-auto">
                      <CommandEmpty>No hay productos encontrados.</CommandEmpty>
                      <CommandGroup>
                        {productos
                          .sort((a, b) => a.producto.localeCompare(b.producto))
                          .map((p) => (
                            <CommandItem
                              key={p.producto}
                              value={p.producto}
                              onSelect={() => handleProductoChange(p.producto)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.producto === p.producto
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <div className="flex-1">
                                <div>{p.producto}</div>
                                <div className="text-xs text-muted-foreground">
                                  Stock: {p.stockDisponible}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {editingVenta && (
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input
                value={formData.producto}
                className="admin-input"
                disabled
              />
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
              <Select
                value={formData.usuarioACargo}
                onValueChange={(value) => setFormData({ ...formData, usuarioACargo: value })}
              >
                <SelectTrigger className="admin-input">
                  <SelectValue placeholder="Selecciona usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fer">Fer</SelectItem>
                  <SelectItem value="So">So</SelectItem>
                  <SelectItem value="Power">Power</SelectItem>
                </SelectContent>
              </Select>
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
              Esta acción eliminará la venta de <strong>{ventaToDelete?.producto}</strong> al cliente <strong>{ventaToDelete?.cliente}</strong>. Esta acción no se puede deshacer.
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
