import React, { useState, useEffect } from 'react';
import { productService, categoryService } from '@/services/api';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, FolderPlus, RotateCcw } from 'lucide-react';
import { StockAdjustmentModal } from '@/components/inventory/StockAdjustmentModal';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    cost: '',
    price: '',
    stockQuantity: '',
    lowStockAlert: '',
    barcode: '',
    isTaxable: true,
    categoryId: '',
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [search]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const response = await categoryService.create({ name: newCategoryName.trim() });
      const newCategory = response.data.data;
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, categoryId: newCategory.id });
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      toast.success('Category created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productService.getAll({
        search,
        page: 1,
        limit: 100,
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        cost: parseFloat(formData.cost),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        lowStockAlert: parseInt(formData.lowStockAlert),
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, data);
      } else {
        await productService.create(data);
      }

      setShowModal(false);
      resetForm();
      loadProducts();
      toast.success(editingProduct ? 'Product updated' : 'Product created');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      cost: product.cost.toString(),
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      lowStockAlert: product.lowStockAlert.toString(),
      barcode: product.barcode || '',
      isTaxable: product.isTaxable,
      categoryId: product.categoryId || '',
    });
    setShowNewCategoryInput(false);
    setNewCategoryName('');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.delete(id);
      loadProducts();
      toast.success('Product deleted');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      cost: '',
      price: '',
      stockQuantity: '',
      lowStockAlert: '',
      barcode: '',
      isTaxable: true,
      categoryId: '',
    });
    setShowNewCategoryInput(false);
    setNewCategoryName('');
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your products and track stock levels
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products table */}
      <Card>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try adjusting your search' : 'Get started by adding your first product'}
            </p>
            {!search && (
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const isLowStock = product.stockQuantity <= product.lowStockAlert;
                const margin = ((product.price - product.cost) / product.price) * 100;

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <span className="font-mono text-sm">{product.sku}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.category && (
                          <p className="text-xs text-muted-foreground">
                            {product.category.name}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-success">
                          {margin.toFixed(1)}% margin
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.cost)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.stockQuantity}</p>
                        <p className="text-xs text-muted-foreground">
                          Alert: {product.lowStockAlert}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <Badge variant="warning">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="success">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAdjustingProduct(product);
                            setShowStockAdjustModal(true);
                          }}
                          title="Adjust Stock"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Product Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
            <Input
              label="Barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
            />
          </div>

          <Input
            label="Product Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            {!showNewCategoryInput ? (
              <div className="flex gap-2">
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCategoryInput(true)}
                  title="Create new category"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                >
                  {isCreatingCategory ? 'Creating...' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setNewCategoryName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Cost Price"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              step="0.01"
              required
            />
            <Input
              type="number"
              label="Retail Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Stock Quantity"
              value={formData.stockQuantity}
              onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              required
            />
            <Input
              type="number"
              label="Low Stock Alert"
              value={formData.lowStockAlert}
              onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
              required
            />
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isTaxable}
              onChange={(e) => setFormData({ ...formData, isTaxable: e.target.checked })}
              className="rounded border-input"
            />
            <span className="text-sm">Taxable item</span>
          </label>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showStockAdjustModal}
        onClose={() => {
          setShowStockAdjustModal(false);
          setAdjustingProduct(null);
        }}
        onSuccess={loadProducts}
        product={adjustingProduct}
      />
    </div>
  );
};
