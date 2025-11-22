import React, { useState, useEffect, useRef } from 'react';
import { productService, saleService, customerService } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import {
  Search,
  X,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Trash2,
  User,
  Phone,
  Star,
  Printer,
  Scan,
} from 'lucide-react';
import { hardware, Receipt } from '@/services/hardware';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
}

export const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'GIFT_CARD' | 'STORE_CREDIT'>('CASH');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Customer linking state
  const [customerPhone, setCustomerPhone] = useState('');
  const [linkedCustomer, setLinkedCustomer] = useState<Customer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
  });

  // Hardware integration state
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
    getItemCount,
  } = useCartStore();

  useEffect(() => {
    loadProducts();
  }, [search]);

  // Barcode scanner setup
  useEffect(() => {
    const handleBarcodeScan = async (barcode: string) => {
      toast.loading(`Searching for barcode: ${barcode}`, { id: 'barcode-search' });

      try {
        // Search for product by barcode/SKU
        const response = await productService.getAll({
          search: barcode,
          isActive: true,
          limit: 10,
        });

        const foundProducts = response.data.data;

        if (foundProducts.length === 1) {
          // Exact match - add to cart
          addItem(foundProducts[0]);
          toast.success(`Added: ${foundProducts[0].name}`, { id: 'barcode-search' });
        } else if (foundProducts.length > 1) {
          // Multiple matches - show in search
          setSearch(barcode);
          toast.success(`Found ${foundProducts.length} products`, { id: 'barcode-search' });
        } else {
          // No match
          toast.error(`Product not found: ${barcode}`, { id: 'barcode-search' });
        }
      } catch (error) {
        console.error('Barcode search failed:', error);
        toast.error('Failed to search product', { id: 'barcode-search' });
      }
    };

    // Register barcode scan handler
    hardware.scanner.onScan(handleBarcodeScan);

    return () => {
      hardware.scanner.offScan(handleBarcodeScan);
    };
  }, [addItem]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const response = await productService.getAll({
        search,
        isActive: true,
        limit: 50,
      });
      setProducts(response.data.data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate receipt data from sale
  const generateReceipt = (saleNumber: string, paid: number): Receipt => {
    return {
      saleNumber,
      date: new Date().toISOString(),
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.product.price * item.quantity,
      })),
      subtotal: getSubtotal(),
      tax: getTax(),
      discount: 0,
      total: getTotal(),
      paymentMethod,
      amountPaid: paid,
      change: paid - getTotal(),
      employeeName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      customerName: linkedCustomer
        ? `${linkedCustomer.firstName} ${linkedCustomer.lastName}`
        : undefined,
      loyaltyPoints: linkedCustomer?.loyaltyPoints,
    };
  };

  // Print receipt for last sale
  const handlePrintReceipt = () => {
    if (!lastReceipt) {
      toast.error('No sale to print');
      return;
    }

    hardware.printer.print(lastReceipt);
    toast.success('Receipt sent to printer');
  };

  // Customer phone lookup with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerPhone.length >= 3) {
        handlePhoneLookup();
      } else {
        setLinkedCustomer(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customerPhone]);

  const handlePhoneLookup = async () => {
    if (!customerPhone) return;

    setIsSearchingCustomer(true);
    try {
      const response = await customerService.searchByPhone(customerPhone);
      const customer = response.data.data;

      if (customer) {
        setLinkedCustomer(customer);
      } else {
        setLinkedCustomer(null);
      }
    } catch (error) {
      console.error('Failed to search customer:', error);
      setLinkedCustomer(null);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleQuickCreateCustomer = async () => {
    try {
      const response = await customerService.create({
        ...newCustomerData,
        phone: customerPhone,
      });

      const customer = response.data.data;
      setLinkedCustomer(customer);
      setShowQuickCreateModal(false);
      setNewCustomerData({ phone: '', firstName: '', lastName: '', email: '' });
      toast.success('Customer created successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create customer');
    }
  };

  const handleClearCustomer = () => {
    setLinkedCustomer(null);
    setCustomerPhone('');
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    setShowPaymentModal(true);
    setAmountPaid(getTotal().toFixed(2));
  };

  const handleCompleteSale = async () => {
    if (items.length === 0) return;

    const paid = parseFloat(amountPaid);
    const total = getTotal();

    if (paid < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      const saleData: any = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          discount: item.discount,
          notes: item.notes,
        })),
        paymentMethod,
        amountPaid: paid,
      };

      // Include customerId if customer is linked
      if (linkedCustomer) {
        saleData.customerId = linkedCustomer.id;
      }

      const response = await saleService.create(saleData);
      const saleNumber = response.data.data?.saleNumber || `SALE-${Date.now()}`;

      // Generate receipt BEFORE clearing cart and trigger hardware actions
      const receipt = generateReceipt(saleNumber, paid);
      setLastReceipt(receipt);
      await hardware.completeSale(receipt, paymentMethod);

      const message = linkedCustomer
        ? `Sale completed for ${linkedCustomer.firstName} ${linkedCustomer.lastName}!\nLoyalty Points Earned: ${Math.floor(total)}\nChange: ${formatCurrency(paid - total)}`
        : `Sale completed! Change: ${formatCurrency(paid - total)}`;

      toast.success(message);
      clearCart();
      handleClearCustomer();
      setShowPaymentModal(false);
      setAmountPaid('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const changeDue = parseFloat(amountPaid || '0') - getTotal();

  return (
    <div className="h-screen flex">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {hardware.scanner.isEnabled() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <Scan className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-500">Scanner</span>
              </div>
            )}
          </div>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addItem(product)}
                  className="p-4 border border-border rounded-lg hover:border-primary hover:shadow-md transition-all text-left bg-card"
                >
                  <div className="aspect-square bg-muted rounded mb-3 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="text-4xl text-muted-foreground">
                        {product.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-sm mb-1 truncate">{product.name}</h3>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(product.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.stockQuantity}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-96 bg-card border-l border-border flex flex-col">
        {/* Cart header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold">Current Sale</h2>
            <div className="flex gap-1">
              {lastReceipt && hardware.printer.isEnabled() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrintReceipt}
                  title="Print last receipt"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              )}
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add products to start a sale
              </p>
            </div>
          ) : (
            items.map((item) => (
              <Card key={item.product.id} className="p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.product.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 border rounded hover:bg-accent"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 border rounded hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.product.price)} each
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Cart footer */}
        <div className="border-t border-border p-4 space-y-3">
          {/* Customer Linking Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Customer Phone
            </label>

            {linkedCustomer ? (
              <Card className="p-3 bg-primary/5 border-primary">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      <p className="font-medium text-sm">
                        {linkedCustomer.firstName} {linkedCustomer.lastName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{linkedCustomer.phone}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <p className="text-xs font-medium">{linkedCustomer.loyaltyPoints} points</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearCustomer}
                    className="p-1 hover:bg-destructive/10 rounded"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </Card>
            ) : (
              <>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Enter phone number..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="pl-10"
                  />
                  {isSearchingCustomer && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {customerPhone.length >= 3 && !linkedCustomer && !isSearchingCustomer && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowQuickCreateModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create New Customer
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm pt-3 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium">{formatCurrency(getTax())}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(getTotal())}</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={items.length === 0}
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Complete Payment"
        size="md"
      >
        <div className="space-y-6">
          {/* Total */}
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-4xl font-bold">{formatCurrency(getTotal())}</p>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <DollarSign className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">Cash</p>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">Card</p>
              </button>
              <button
                onClick={() => setPaymentMethod('GIFT_CARD')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'GIFT_CARD'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <CreditCard className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">Gift Card</p>
              </button>
              <button
                onClick={() => setPaymentMethod('STORE_CREDIT')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  paymentMethod === 'STORE_CREDIT'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <DollarSign className="h-6 w-6 mx-auto mb-2" />
                <p className="font-medium">Store Credit</p>
              </button>
            </div>
          </div>

          {/* Amount paid */}
          <Input
            type="number"
            label="Amount Paid"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            step="0.01"
            min={getTotal()}
            autoFocus
          />

          {/* Change */}
          {parseFloat(amountPaid) >= getTotal() && (
            <div className="p-4 bg-success/10 border border-success rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Change Due</span>
                <span className="text-2xl font-bold text-success">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPaymentModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCompleteSale}
              disabled={isProcessing || parseFloat(amountPaid) < getTotal()}
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </div>

          {/* Print receipt option */}
          {hardware.printer.isEnabled() && (
            <div className="pt-3 border-t mt-3">
              <p className="text-xs text-muted-foreground text-center">
                Receipt will be printed automatically after sale completion
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Quick Create Customer Modal */}
      <Modal
        isOpen={showQuickCreateModal}
        onClose={() => setShowQuickCreateModal(false)}
        title="Create New Customer"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create a new customer for phone: <span className="font-medium">{customerPhone}</span>
          </p>

          <Input
            type="text"
            label="First Name"
            placeholder="Enter first name..."
            value={newCustomerData.firstName}
            onChange={(e) =>
              setNewCustomerData({ ...newCustomerData, firstName: e.target.value })
            }
            required
            autoFocus
          />

          <Input
            type="text"
            label="Last Name"
            placeholder="Enter last name..."
            value={newCustomerData.lastName}
            onChange={(e) =>
              setNewCustomerData({ ...newCustomerData, lastName: e.target.value })
            }
            required
          />

          <Input
            type="email"
            label="Email (Optional)"
            placeholder="customer@example.com"
            value={newCustomerData.email}
            onChange={(e) =>
              setNewCustomerData({ ...newCustomerData, email: e.target.value })
            }
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowQuickCreateModal(false);
                setNewCustomerData({ phone: '', firstName: '', lastName: '', email: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleQuickCreateCustomer}
              disabled={!newCustomerData.firstName || !newCustomerData.lastName}
            >
              Create Customer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
