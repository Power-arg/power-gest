import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { FormDialog } from '@/components/admin/FormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Compra } from '@/types/admin';
import { getCompras, createCompra, updateCompra, deleteCompra, getProductos } from '@/lib/api';
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

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [productos, setProductos] = useState<{ producto: string; proveedor: string; marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' }[]>([]);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [compraToDelete, setCompraToDelete] = useState<Compra | null>(null);

  const [formData, setFormData] = useState({
    producto: '',
    proveedor: '',
    marca: 'ENA' as 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar',
    precioUnitarioCompra: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const fetchCompras = async () => {
    try {
      const data = await getCompras();
      setCompras(data);
    } catch (error: any) {
      toast({ title: 'Error al cargar compras', description: error.message, variant: 'destructive' });
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
    fetchCompras();
    fetchProductos();
  }, []);

  const resetForm = () => {
    setFormData({
      producto: '',
      proveedor: '',
      marca: 'ENA',
      precioUnitarioCompra: '',
      cantidad: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setIsNewProduct(false);
    setEditingCompra(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    fetchProductos();
    setDialogOpen(true);
  };

  const handleProductoProveedorChange = (value: string) => {
    if (value === 'new') {
      setIsNewProduct(true);
      setFormData({ ...formData, producto: '', proveedor: '', marca: 'ENA' });
    } else {
      const [producto, proveedor] = value.split('|||');
      const selectedProduct = productos.find(p => p.producto === producto && p.proveedor === proveedor);
      setIsNewProduct(false);
      setFormData({ 
        ...formData, 
        producto, 
        proveedor,
        marca: selectedProduct?.marca || 'ENA'
      });
    }
  };

  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra);
    setFormData({
      producto: compra.producto,
      proveedor: compra.proveedor,
      marca: compra.marca,
      precioUnitarioCompra: compra.precioUnitarioCompra.toString(),
      cantidad: compra.cantidad.toString(),
      fecha: compra.fecha,
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (compra: Compra) => {
    setCompraToDelete(compra);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!compraToDelete) return;
    try {
      await deleteCompra(compraToDelete.id);
      toast({ title: 'Compra eliminada' });
      fetchCompras();
      fetchProductos();
    } catch (error: any) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setCompraToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validaciones
      if (!formData.producto || !formData.proveedor || !formData.marca || !formData.precioUnitarioCompra || !formData.cantidad) {
        toast({ title: 'Todos los campos son requeridos', variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      const compraData = {
        producto: formData.producto,
        proveedor: formData.proveedor,
        marca: formData.marca,
        precioUnitarioCompra: parseFloat(formData.precioUnitarioCompra),
        cantidad: parseInt(formData.cantidad),
        fecha: formData.fecha,
      };

      if (editingCompra) {
        await updateCompra(editingCompra.id, compraData);
        toast({ title: 'Compra actualizada' });
      } else {
        await createCompra(compraData);
        toast({ title: 'Compra creada' });
      }

      setDialogOpen(false);
      resetForm();
      fetchCompras();
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
  };

  const columns = [
    { 
      key: 'producto', 
      label: 'Producto',
      render: (c: Compra) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span>{c.producto}</span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${marcaColors[c.marca]}`}>
            {c.marca}
          </span>
        </div>
      ),
    },
    { key: 'proveedor', label: 'Proveedor' },
    {
      key: 'precioUnitarioCompra',
      label: 'Precio Unit.',
      render: (c: Compra) => formatCurrency(c.precioUnitarioCompra),
    },
    { key: 'cantidad', label: 'Cantidad' },
    {
      key: 'total',
      label: 'Total',
      render: (c: Compra) => formatCurrency(c.precioUnitarioCompra * c.cantidad),
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
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Compras</h1>
          <p className="text-muted-foreground text-sm">Gestiona las compras de stock</p>
        </div>
        <Button onClick={handleOpenCreate} className="admin-button gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={compras}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          searchKey="producto"
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        {compras.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            No hay compras registradas
          </div>
        ) : (
          compras.map((compra) => (
            <div key={compra.id} className="glass-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{compra.producto}</h3>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${marcaColors[compra.marca]}`}>
                      {compra.marca}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{compra.proveedor}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(compra)}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteClick(compra)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Precio Unit.</p>
                  <p className="font-medium text-foreground">{formatCurrency(compra.precioUnitarioCompra)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cantidad</p>
                  <p className="font-medium text-foreground">{compra.cantidad}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-foreground">{formatCurrency(compra.precioUnitarioCompra * compra.cantidad)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium text-foreground">{compra.fecha}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCompra ? 'Editar Compra' : 'Nueva Compra'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingCompra && (
            <div className="space-y-2">
              <Label htmlFor="productoProveedor">Producto - Proveedor</Label>
              <Select
                value={
                  isNewProduct 
                    ? 'new' 
                    : formData.producto && formData.proveedor 
                    ? `${formData.producto}|||${formData.proveedor}` 
                    : ''
                }
                onValueChange={handleProductoProveedorChange}
              >
                <SelectTrigger className="admin-input">
                  <SelectValue placeholder="Selecciona o crea nuevo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">+ Nuevo Producto</SelectItem>
                  {productos.map((p) => (
                    <SelectItem key={`${p.producto}|||${p.proveedor}`} value={`${p.producto}|||${p.proveedor}`}>
                      {p.producto} - {p.proveedor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(isNewProduct || editingCompra) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="producto">Producto</Label>
                  <Input
                    id="producto"
                    value={formData.producto}
                    onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                    className="admin-input"
                    disabled={editingCompra !== null}
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
                    disabled={editingCompra !== null}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Select
                  value={formData.marca}
                  onValueChange={(value) => setFormData({ ...formData, marca: value as typeof formData.marca })}
                >
                  <SelectTrigger className="admin-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENA">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        ENA
                      </div>
                    </SelectItem>
                    <SelectItem value="Star">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        Star
                      </div>
                    </SelectItem>
                    <SelectItem value="Body Advance">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Body Advance
                      </div>
                    </SelectItem>
                    <SelectItem value="Gentech">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-900"></div>
                        Gentech
                      </div>
                    </SelectItem>
                    <SelectItem value="GoldNutrition">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        GoldNutrition
                      </div>
                    </SelectItem>
                    <SelectItem value="Growsbar">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                        Growsbar
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio Unitario</Label>
              <Input
                id="precio"
                type="number"
                value={formData.precioUnitarioCompra}
                onChange={(e) => setFormData({ ...formData, precioUnitarioCompra: e.target.value })}
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
              {editingCompra ? 'Guardar' : 'Crear'}
            </Button>
          </div>
        </form>
      </FormDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la compra de <strong>{compraToDelete?.producto}</strong> del proveedor <strong>{compraToDelete?.proveedor}</strong>. Esta acción no se puede deshacer.
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
