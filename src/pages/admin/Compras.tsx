import { useEffect, useState } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { FormDialog } from '@/components/admin/FormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { Compra } from '@/types/admin';
import { getCompras, createCompra, updateCompra, deleteCompra } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

export default function Compras() {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    producto: '',
    proveedor: '',
    precioUnitarioCompra: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const fetchCompras = async () => {
    try {
      const data = await getCompras();
      setCompras(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  const resetForm = () => {
    setFormData({
      producto: '',
      proveedor: '',
      precioUnitarioCompra: '',
      cantidad: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setEditingCompra(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (compra: Compra) => {
    setEditingCompra(compra);
    setFormData({
      producto: compra.producto,
      proveedor: compra.proveedor,
      precioUnitarioCompra: compra.precioUnitarioCompra.toString(),
      cantidad: compra.cantidad.toString(),
      fecha: compra.fecha,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (compra: Compra) => {
    if (!confirm('¿Estás seguro de eliminar esta compra?')) return;
    try {
      await deleteCompra(compra.id);
      toast({ title: 'Compra eliminada' });
      fetchCompras();
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const compraData = {
        producto: formData.producto,
        proveedor: formData.proveedor,
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
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1">Compras</h1>
          <p className="text-muted-foreground">Gestiona las compras de stock</p>
        </div>
        <Button onClick={handleOpenCreate} className="admin-button gap-2">
          <Plus className="h-4 w-4" />
          Nueva Compra
        </Button>
      </div>

      <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={compras}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchKey="producto"
        />
      </div>

      <FormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingCompra ? 'Editar Compra' : 'Nueva Compra'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="producto">Producto</Label>
              <Input
                id="producto"
                value={formData.producto}
                onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                className="admin-input"
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
    </div>
  );
}
