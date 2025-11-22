import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  DollarSign,
  XCircle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableBody,
  TableRow,
  TableHeader,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { layawayService, customerService, productService } from '@/services/api';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';

export const Layaway: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [layaways, setLayaways] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedLayaway, setSelectedLayaway] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [statusFilter, setStatusFilter] = useState('');

  // Create layaway state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [newLayaway, setNewLayaway] = useState({
    customerId: '',
    customerName: '',
    items: [] as any[],
    initialPayment: '',
    expiresAt: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [layawaysRes, summaryRes] = await Promise.all([
        layawayService.getAll({ status: statusFilter || undefined }),
        layawayService.getSummary(),
      ]);
      setLayaways(layawaysRes.data.data || []);
      setSummary(summaryRes.data.data);
    } catch (error) {
      console.error('Failed to fetch layaways:', error);
      toast.error('Failed to load layaways');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value || 0);
  };

  const handleMakePayment = async () => {
    if (!selectedLayaway || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > selectedLayaway.balance) {
      toast.error(`Amount exceeds balance of ${formatCurrency(selectedLayaway.balance)}`);
      return;
    }

    try {
      await layawayService.makePayment(selectedLayaway.id, {
        amount,
        paymentMethod,
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      setSelectedLayaway(null);
      setPaymentAmount('');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleCancelLayaway = async (id: string) => {
    const reason = prompt('Reason for cancellation (optional):');
    try {
      await layawayService.cancel(id, reason || undefined);
      toast.success('Layaway cancelled');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel layaway');
    }
  };

  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    try {
      const response = await customerService.getAll({ search: query, limit: 10 });
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Failed to search customers:', error);
    }
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) {
      setProducts([]);
      return;
    }
    try {
      const response = await productService.getAll({ search: query, limit: 10 });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Failed to search products:', error);
    }
  };

  const addItemToLayaway = (product: any) => {
    const existingItem = newLayaway.items.find(item => item.productId === product.id);
    if (existingItem) {
      setNewLayaway(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        ),
      }));
    } else {
      setNewLayaway(prev => ({
        ...prev,
        items: [...prev.items, {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
        }],
      }));
    }
    setProductSearch('');
    setProducts([]);
  };

  const removeItemFromLayaway = (productId: string) => {
    setNewLayaway(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId),
    }));
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setNewLayaway(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.productId === productId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ),
    }));
  };

  const getLayawayTotal = () => {
    return newLayaway.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreateLayaway = async () => {
    if (!newLayaway.customerId) {
      toast.error('Please select a customer');
      return;
    }
    if (newLayaway.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      await layawayService.create({
        customerId: newLayaway.customerId,
        items: newLayaway.items,
        initialPayment: newLayaway.initialPayment ? parseFloat(newLayaway.initialPayment) : 0,
        expiresAt: newLayaway.expiresAt || undefined,
        notes: newLayaway.notes || undefined,
      });
      toast.success('Layaway created successfully');
      setShowCreateModal(false);
      setNewLayaway({
        customerId: '',
        customerName: '',
        items: [],
        initialPayment: '',
        expiresAt: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create layaway');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="warning">Active</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Layaway Management</h1>
          <p className="text-muted-foreground">
            Manage partial payments and payment plans
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Layaway
          </Button>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.counts.active}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{summary.counts.completed}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
            <p className="text-2xl font-bold text-orange-600">{summary.counts.expiringSoon}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.activeTotals.totalValue)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.activeTotals.totalBalance)}</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={statusFilter === '' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={statusFilter === 'ACTIVE' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('ACTIVE')}
          size="sm"
        >
          <Clock className="w-4 h-4 mr-1" />
          Active
        </Button>
        <Button
          variant={statusFilter === 'COMPLETED' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('COMPLETED')}
          size="sm"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </Button>
        <Button
          variant={statusFilter === 'CANCELLED' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('CANCELLED')}
          size="sm"
        >
          <XCircle className="w-4 h-4 mr-1" />
          Cancelled
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Layaway #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {layaways.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No layaways found
                  </TableCell>
                </TableRow>
              ) : (
                layaways.map((layaway) => (
                  <TableRow key={layaway.id}>
                    <TableCell className="font-mono text-sm">
                      {layaway.layawayNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {layaway.customer?.firstName} {layaway.customer?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {layaway.customer?.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{layaway.items?.length || 0} items</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(layaway.total)}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(layaway.amountPaid)}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {formatCurrency(layaway.balance)}
                    </TableCell>
                    <TableCell>{getStatusBadge(layaway.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(layaway.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {layaway.status === 'ACTIVE' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedLayaway(layaway);
                                setShowPaymentModal(true);
                              }}
                            >
                              <DollarSign className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelLayaway(layaway.id)}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLayaway && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Make Payment</h3>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded">
                <p className="text-sm text-muted-foreground">Layaway</p>
                <p className="font-medium">{selectedLayaway.layawayNumber}</p>
                <p className="text-sm mt-2">
                  Balance: <span className="font-bold text-red-600">{formatCurrency(selectedLayaway.balance)}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  step="0.01"
                  min="0"
                  max={selectedLayaway.balance}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaymentAmount((selectedLayaway.balance / 2).toFixed(2))}
                  >
                    50%
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPaymentAmount(selectedLayaway.balance.toFixed(2))}
                  >
                    Full
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedLayaway(null);
                    setPaymentAmount('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleMakePayment}>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Create Layaway Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Layaway</h3>

            <div className="space-y-4">
              {/* Customer Search */}
              <div>
                <label className="text-sm font-medium">Customer *</label>
                {newLayaway.customerId ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md mt-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{newLayaway.customerName}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNewLayaway(prev => ({ ...prev, customerId: '', customerName: '' }))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative mt-1">
                    <div className="flex items-center">
                      <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                      <Input
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          searchCustomers(e.target.value);
                        }}
                        placeholder="Search customers..."
                        className="pl-9"
                      />
                    </div>
                    {customers.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {customers.map((customer) => (
                          <button
                            key={customer.id}
                            className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                            onClick={() => {
                              setNewLayaway(prev => ({
                                ...prev,
                                customerId: customer.id,
                                customerName: `${customer.firstName} ${customer.lastName}`,
                              }));
                              setCustomerSearch('');
                              setCustomers([]);
                            }}
                          >
                            <User className="w-4 h-4" />
                            <div>
                              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Search */}
              <div>
                <label className="text-sm font-medium">Add Products</label>
                <div className="relative mt-1">
                  <div className="flex items-center">
                    <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                    <Input
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        searchProducts(e.target.value);
                      }}
                      placeholder="Search products by name or SKU..."
                      className="pl-9"
                    />
                  </div>
                  {products.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {products.map((product) => (
                        <button
                          key={product.id}
                          className="w-full px-3 py-2 text-left hover:bg-accent flex justify-between items-center"
                          onClick={() => addItemToLayaway(product)}
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              {newLayaway.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Items</label>
                  <div className="mt-1 border rounded-md divide-y">
                    {newLayaway.items.map((item) => (
                      <div key={item.productId} className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <span className="font-medium w-20 text-right">{formatCurrency(item.total)}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItemFromLayaway(item.productId)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 bg-muted flex justify-between font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(getLayawayTotal())}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Initial Payment */}
              <div>
                <label className="text-sm font-medium">Initial Payment (Optional)</label>
                <Input
                  type="number"
                  value={newLayaway.initialPayment}
                  onChange={(e) => setNewLayaway(prev => ({ ...prev, initialPayment: e.target.value }))}
                  placeholder="0.00"
                  className="mt-1"
                  step="0.01"
                  min="0"
                />
              </div>

              {/* Expiration Date */}
              <div>
                <label className="text-sm font-medium">Expiration Date (Optional)</label>
                <Input
                  type="date"
                  value={newLayaway.expiresAt}
                  onChange={(e) => setNewLayaway(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="mt-1"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  value={newLayaway.notes}
                  onChange={(e) => setNewLayaway(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewLayaway({
                      customerId: '',
                      customerName: '',
                      items: [],
                      initialPayment: '',
                      expiresAt: '',
                      notes: '',
                    });
                    setCustomerSearch('');
                    setProductSearch('');
                    setCustomers([]);
                    setProducts([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateLayaway}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Layaway
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Layaway;