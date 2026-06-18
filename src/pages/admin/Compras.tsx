import { useEffect, useState } from 'react';
import { useScrollThumb } from '@/hooks/useScrollThumb';
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
import { Plus, Loader2, Pencil, Trash2, Check, ChevronsUpDown, Search } from 'lucide-react';
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
  const [productos, setProductos] = useState<{ producto: string; marca: 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Crudda' | 'Granger' | 'OneFit' | 'Nutremax' | 'Integra' | 'Otro'; stockDisponible: number; precioUnitarioVenta: number }[]>([]);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [compraToDelete, setCompraToDelete] = useState<Compra | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<string>('');
  const [openProveedorFilter, setOpenProveedorFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [openProducto, setOpenProducto] = useState(false);
  const [openProveedorPicker, setOpenProveedorPicker] = useState(false);
  const [isNewProveedor, setIsNewProveedor] = useState(false);
  const productoScroll = useScrollThumb();
  const proveedorFilterScroll = useScrollThumb();
  const proveedorFormScroll = useScrollThumb();

  const [formData, setFormData] = useState({
    producto: '',
    proveedor: '',
    marca: 'ENA' as 'ENA' | 'Star' | 'Body Advance' | 'Gentech' | 'GoldNutrition' | 'Growsbar' | 'Crudda' | 'Granger' | 'OneFit' | 'Nutremax' | 'Integra' | 'Otro',
    precioUnitarioCompra: '',
    cantidad: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  const fetchCompras = async () => {
    try {
      const data = await getCompras();
      // Ordenar por fecha de más reciente a más antigua
      const sorted = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      setCompras(sorted);
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

  useEffect(() => {
    if (productoScroll.containerRef.current) {
      productoScroll.containerRef.current.scrollTop = 0;
    }
  }, [openProducto, productos, productoScroll.containerRef]);

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
    setIsNewProveedor(false);
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
      const selectedProduct = productos.find(p => p.producto === value);
      setIsNewProduct(false);
      setFormData({
        ...formData,
        producto: value,
        proveedor: '',
        marca: selectedProduct?.marca || 'ENA'
      });
    }
    setIsNewProveedor(false);
    setOpenProducto(false);
  };

  const handleProveedorChange = (value: string) => {
    if (value === 'new') {
      setIsNewProveedor(true);
      setFormData({ ...formData, proveedor: '' });
    } else {
      setIsNewProveedor(false);
      setFormData({ ...formData, proveedor: value });
    }
    setOpenProveedorPicker(false);
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
      if (!formData.producto || !formData.proveedor || !formData.marca || formData.precioUnitarioCompra === '' || !formData.cantidad) {
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
    'Growsbar': 'bg-gray-600 text-white',
    'Crudda': 'bg-orange-500 text-white',
    'Granger': 'bg-amber-900 text-white',
    'OneFit': 'bg-red-800 text-white',
    'Nutremax': 'bg-pink-500 text-white',
    'Integra': 'bg-yellow-600 text-white',
    'Otro': 'bg-gray-300 text-black',
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

  const filteredCompras = compras.filter((c) => {
    const matchesProveedor = selectedProveedor === '' || c.proveedor === selectedProveedor;
    const matchesSearch = c.producto.toLowerCase().includes(search.toLowerCase());
    return matchesProveedor && matchesSearch;
  });

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

      {/* Filters (search + proveedor) - shared between mobile and desktop, adapts instead of hiding */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 admin-input"
          />
        </div>
        <div className="w-full sm:w-60">
          <Popover open={openProveedorFilter} onOpenChange={setOpenProveedorFilter}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openProveedorFilter}
                className="w-full justify-between admin-input h-10 px-3 py-2 font-normal"
              >
                <span className="truncate">{selectedProveedor || "Todos los proveedores"}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom" avoidCollisions={false}>
              <Command>
                <CommandInput placeholder="Buscar proveedor..." />
                <div className="relative">
                  <CommandList
                    ref={proveedorFilterScroll.containerRef}
                    onScroll={proveedorFilterScroll.update}
                    className="scrollbar-thin"
                  >
                    <CommandEmpty>No hay proveedores encontrados.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="Todos los proveedores"
                        onSelect={() => {
                          setSelectedProveedor('');
                          setOpenProveedorFilter(false);
                        }}
                      >
                        <Check className={`mr-2 h-4 w-4 ${selectedProveedor === '' ? "opacity-100" : "opacity-0"}`} />
                        Todos los proveedores
                      </CommandItem>
                      {Array.from(new Set(compras.map(c => c.proveedor))).sort().map((proveedor) => (
                        <CommandItem
                          key={proveedor}
                          value={proveedor}
                          onSelect={() => {
                            setSelectedProveedor(proveedor);
                            setOpenProveedorFilter(false);
                          }}
                        >
                          <Check className={`mr-2 h-4 w-4 ${selectedProveedor === proveedor ? "opacity-100" : "opacity-0"}`} />
                          {proveedor}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  <div
                    ref={proveedorFilterScroll.thumbRef}
                    className="absolute right-0.5 top-0 w-1 rounded-full bg-border opacity-0 transition-opacity sm:hidden pointer-events-none"
                    style={{ height: '20%' }}
                  />
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <DataTable
          data={filteredCompras}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
        {filteredCompras.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            No hay compras registradas
          </div>
        ) : (
          filteredCompras.map((compra) => (
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
              <Label htmlFor="producto">Producto</Label>
              <Popover open={openProducto} onOpenChange={setOpenProducto}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProducto}
                    className="w-full justify-between admin-input h-10 px-3 py-2 font-normal"
                  >
                    <span className="truncate">
                      {isNewProduct
                        ? "+ Nuevo Producto"
                        : formData.producto
                        ? formData.producto
                        : "Selecciona o crea nuevo..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom" avoidCollisions={false}>
                  <Command>
                    <CommandInput placeholder="Buscar producto..." />
                    <div className="relative">
                      <CommandList
                        ref={productoScroll.containerRef}
                        onScroll={productoScroll.update}
                        className="overflow-y-auto scrollbar-thin"
                      >
                        <CommandEmpty>No hay productos encontrados.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="new"
                            onSelect={() => handleProductoProveedorChange("new")}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                isNewProduct ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            + Nuevo Producto
                          </CommandItem>
                          {productos
                            .sort((a, b) => a.producto.localeCompare(b.producto))
                            .map((p) => (
                              <CommandItem
                                key={p.producto}
                                value={p.producto}
                                onSelect={() =>
                                  handleProductoProveedorChange(p.producto)
                                }
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    !isNewProduct && formData.producto === p.producto
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {p.producto}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                      <div
                        ref={productoScroll.thumbRef}
                        className="absolute right-0.5 top-0 w-1 rounded-full bg-border opacity-0 transition-opacity sm:hidden pointer-events-none"
                        style={{ height: '20%' }}
                      />
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {isNewProduct && (
            <div className="space-y-2">
              <Label htmlFor="producto">Nombre del Producto</Label>
              <Input
                id="producto"
                value={formData.producto}
                onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                className="admin-input"
                placeholder="Ej: Whey Protein"
                required
              />
            </div>
          )}

          {editingCompra && (
            <div className="space-y-2">
              <Label>Producto</Label>
              <Input
                value={formData.producto}
                className="admin-input"
                disabled
              />
            </div>
          )}

          {!editingCompra && (
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor</Label>
              <Popover open={openProveedorPicker} onOpenChange={setOpenProveedorPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openProveedorPicker}
                    className="w-full justify-between admin-input h-10 px-3 py-2 font-normal"
                  >
                    <span className="truncate">
                      {isNewProveedor
                        ? "+ Nuevo Proveedor"
                        : formData.proveedor
                        ? formData.proveedor
                        : "Selecciona o crea nuevo..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" side="bottom" avoidCollisions={false}>
                  <Command>
                    <CommandInput placeholder="Buscar proveedor..." />
                    <div className="relative">
                      <CommandList
                        ref={proveedorFormScroll.containerRef}
                        onScroll={proveedorFormScroll.update}
                        className="scrollbar-thin"
                      >
                        <CommandEmpty>No hay proveedores encontrados.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="new"
                            onSelect={() => handleProveedorChange("new")}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                isNewProveedor ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            + Nuevo Proveedor
                          </CommandItem>
                          {Array.from(new Set(compras.map(c => c.proveedor))).sort().map((proveedor) => (
                            <CommandItem
                              key={proveedor}
                              value={proveedor}
                              onSelect={() => handleProveedorChange(proveedor)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  !isNewProveedor && formData.proveedor === proveedor
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              {proveedor}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                      <div
                        ref={proveedorFormScroll.thumbRef}
                        className="absolute right-0.5 top-0 w-1 rounded-full bg-border opacity-0 transition-opacity sm:hidden pointer-events-none"
                        style={{ height: '20%' }}
                      />
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {isNewProveedor && (
            <div className="space-y-2">
              <Label htmlFor="proveedorNuevo">Nombre del Proveedor</Label>
              <Input
                id="proveedorNuevo"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                className="admin-input"
                placeholder="Ej: ProveedorX"
                required
              />
            </div>
          )}

          {editingCompra && (
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Input
                value={formData.proveedor}
                className="admin-input"
                disabled
              />
            </div>
          )}

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
                <SelectItem value="Growsbar">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                    Growsbar
                  </div>
                </SelectItem>
                <SelectItem value="Crudda">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    Crudda
                  </div>
                </SelectItem>
                <SelectItem value="Granger">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-900"></div>
                    Granger
                  </div>
                </SelectItem>
                <SelectItem value="OneFit">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-700"></div>
                    OneFit
                  </div>
                </SelectItem>
                <SelectItem value="Nutremax">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    Nutremax
                  </div>
                </SelectItem>
                <SelectItem value="Integra">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
                    Integra
                  </div>
                </SelectItem>
                <SelectItem value="Otro">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    Otro
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

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
