import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle, PauseCircle, Clock, PlayCircle, XCircle, Home, LogOut, FileSearch, RotateCcw, Monitor, Ticket, AlertTriangle, RefreshCw, Printer, Tag, Bell, ShoppingCart } from 'lucide-react';
import { fetchVouchersBySaleId } from '../api/vouchers';
import Modal from '../components/Modal';
// Alert component removed (using global)
import { printReceipt } from '../templates/BillTemplate';
import { fetchProductsPaged, useProductsPaged } from '../api/products';
import { fetchSettingsMap, useSettingsMap } from '../api/settings';
import { createSale, updateSale } from '../api/sales';
import { fetchApprovedReturns, useApprovedReturns } from '../api/returns';
import ProductLogsModal from '../components/products/ProductLogsModal'; // Import ProductLogsModal
import CashPaymentModal from '../components/pos/CashPaymentModal';
import VoucherPaymentModal from '../components/pos/VoucherPaymentModal';
import PaymentSuccessModal from '../components/pos/PaymentSuccessModal';
import HeldSalesModal from '../components/pos/HeldSalesModal';
import RetrieveBillModal from '../components/pos/RetrieveBillModal';
import DamageReturnModal from '../components/pos/DamageReturnModal';
import ClearCartModal from '../components/pos/ClearCartModal';
import { useStore } from '../context/StoreContext';
import { useAlert } from '../context/AlertContext';

const POS = () => {
    const navigate = useNavigate();
    const { selectedStoreId, role } = useStore();
    const { showAlert } = useAlert();
    const isOwner = role === 'OWNER';
    const isCashier = role === 'CASHIER';
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('pos_cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [manualLoading, setManualLoading] = useState(false);

    // Partial Voucher State
    const [partialVoucher, setPartialVoucher] = useState(null); // { code, amount }

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 12; // Load 12 items initially/per page
    const debounceTimeout = useRef(null);

    // Success Modal State
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastSaleTotal, setLastSaleTotal] = useState(0);

    // Exchange Logic
    const [originalSaleTotal, setOriginalSaleTotal] = useState(0);

    const [heldSales, setHeldSales] = useState(() => {
        const saved = localStorage.getItem('heldSales');
        return saved ? JSON.parse(saved) : [];
    });
    const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Retrieve / Edit Bill State
    const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
    const [retrieveId, setRetrieveId] = useState('');
    const [editingSaleId, setEditingSaleId] = useState(null);
    const [exchangeVouchers, setExchangeVouchers] = useState([]); // Vouchers linked to edited bill
    const [returnDeduction, setReturnDeduction] = useState(0);

    const searchInputRef = useRef(null);
    const discountInputRef = useRef(null);


    // Returns State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnBillId, setReturnBillId] = useState('');
    const [returnSaleData, setReturnSaleData] = useState(null);
    const [createdVoucher, setCreatedVoucher] = useState(null);

    // Voucher Redemption State
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    // voucherCode and verifiedVoucher moved to VoucherPaymentModal

    const [discount, setDiscount] = useState(0);
    const [showDiscountInput, setShowDiscountInput] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    // TanStack Query Hooks
    const { data: posSettings = {} } = useSettingsMap(selectedStoreId);
    const { data: approvedReturns = [] } = useApprovedReturns(selectedStoreId);
    const [notifications, setNotifications] = useState([]);

    // Derive Notifications
    useEffect(() => {
        if (showDiscountInput && discountInputRef.current) {
            discountInputRef.current.focus();
        }
    }, [showDiscountInput]);

    useEffect(() => {
        if (!approvedReturns) return;
        const grouped = approvedReturns.reduce((acc, item) => {
            acc[item.originalSaleId] = (acc[item.originalSaleId] || 0) + 1;
            return acc;
        }, {});
        const notifList = Object.entries(grouped).map(([id, count]) => ({ saleId: id, count }));
        setNotifications(notifList);
    }, [approvedReturns]);

    const handleNotificationClick = (saleId) => {
        setReturnBillId(saleId);
        setReturnSaleData(null);
        setCreatedVoucher(null);
        setIsReturnModalOpen(true);
        setShowNotificationDropdown(false);
    };

    const subtotal = cart.reduce((sum, item) => {
        const itemPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
        return sum + (itemPrice * item.quantity);
    }, 0);

    const total = subtotal - (subtotal * (discount / 100));

    // Products Query
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            // setCurrentPage(1); // Moving this to setDebouncedSearch might cause double render? 
            // Logic: If term changes, page should be 1. 
            // But if I click page 2, term doesn't change.
            // If I change term, page reset happens here.
            // But wait, if I change term, debouncedSearch updates -> Query runs with P1.
            // BUT currentPage state variable needs to be reset so UI shows Page 1.
            // So yes, reset here.
            if (searchTerm !== debouncedSearch) setCurrentPage(1);
        }, 300);
        debounceTimeout.current = handler;
        return () => clearTimeout(handler);
    }, [searchTerm]); // removed debouncedSearch dep to avoid loop

    const { data: productData, isLoading: productsLoading, refetch } = useProductsPaged({
        storeId: selectedStoreId,
        page: currentPage - 1,
        size: itemsPerPage,
        search: debouncedSearch
    });

    useEffect(() => {
        if (productData) {
            if (currentPage === 1) {
                setProducts(productData.content);
            } else {
                setProducts(prev => {
                    const newItems = productData.content.filter(n => !prev.some(p => p.id === n.id));
                    return [...prev, ...newItems];
                });
            }
            setTotalPages(productData.totalPages);
            setTotalItems(productData.totalElements);
        }
    }, [productData, currentPage]);

    // Persist held sales
    useEffect(() => {
        localStorage.setItem('heldSales', JSON.stringify(heldSales));
    }, [heldSales]);

    // Persist active cart (Safety for refresh/logout)
    useEffect(() => {
        localStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);

    const handleHoldSale = () => {
        if (cart.length === 0) {
            showAlert("Cart is empty!");
            return;
        }
        const sale = {
            id: Date.now(),
            items: cart,
            total,
            date: new Date().toLocaleString()
        };
        setHeldSales(prev => [sale, ...prev]);
        setCart([]);
        showAlert("Sale placed on hold.");
    };

    const handleRecallSale = (sale) => {
        if (cart.length > 0) {
            if (!window.confirm("Current cart will be OVERWRITTEN. Continue?")) return;
        }
        setCart(sale.items);
        setHeldSales(prev => prev.filter(s => s.id !== sale.id));
        setIsHoldModalOpen(false);
        showAlert("Sale recalled.");
    };

    const handleDiscardHold = (id) => {
        setHeldSales(prev => prev.filter(s => s.id !== id));
    };

    const confirmLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('storeId');
        navigate('/login');
    };

    // Define loading alias for render compatibility
    const loading = productsLoading || manualLoading;

    const addToCart = (product) => {
        if (product.stock <= 0) {
            showAlert("This item is out of stock!");
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.quantity + 1 > product.stock) {
                    showAlert(`Cannot add more. Only ${product.stock} items in stock.`);
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    // Handle barcode scan or manual search submit
    const handleSearchSubmit = async (e) => {
        if (e.key === 'Enter') {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
            let term = searchTerm.trim();
            if (!term) return;

            // Handle QR Code Scan (Barcode:::Name:::Price) - OLD
            if (term.includes(':::')) {
                const parts = term.split(':::');
                term = parts[0];
                setSearchTerm(term);
            }
            // Handle New Readable Format (Name | Price | Code: 123)
            else if (term.includes(' | Code: ')) {
                const parts = term.split(' | ');
                const codePart = parts.find(p => p.startsWith('Code: '));
                if (codePart) {
                    term = codePart.replace('Code: ', '').trim();
                    setSearchTerm(term);
                }
            }

            // Immediate API Search
            setManualLoading(true);
            try {
                const data = await fetchProductsPaged({
                    storeId: selectedStoreId,
                    page: 0,
                    size: itemsPerPage,
                    search: term
                });
                const results = data.content;
                setManualLoading(false);

                // Check exact barcode match
                const exactMatch = results.find(p =>
                    String(p.barcode || '').toLowerCase() === term.toLowerCase()
                );

                if (exactMatch) {
                    addToCart(exactMatch);
                    setSearchTerm(''); // Clear search to reset grid
                } else {
                    // Just ensure term is set so List updates (via debounce/state)
                    setSearchTerm(term);
                }
            } catch (err) {
                console.error(err);
                setManualLoading(false);
            }
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === id) {
                    const newQuantity = item.quantity + delta;
                    if (newQuantity > item.stock) { // Need to ensure item has stock prop or find from products
                        // Since item is a copy, we might assume it has stock from when added. 
                        // However, best to look up original product to be safe or ensure stock is preserved in cart item.
                        // For this implementation, I'll rely on item having stock which it should from addToCart(...product)
                        showAlert(`Cannot add more. Only ${item.stock} items in stock.`);
                        return item;
                    }
                    return { ...item, quantity: Math.max(1, newQuantity) };
                }
                return item;
            });
        });
    };

    const removeFromCart = (id) => {
        console.log("Removing Item ID:", id);
        setCart(prev => prev.filter(item => String(item.id) !== String(id)));
    };


    // Retrieve Bill Logic
    const handleRetrieveClick = () => {
        setIsRetrieveModalOpen(true);
    };

    const handleBillRetrieved = async (sale) => {
        // Populate Cart
        const remappedItems = sale.items.map(item => {
            return {
                id: item.productId,
                name: item.productName || "Unknown Item",
                price: item.price,
                quantity: item.quantity,
                stock: 9999, // Bypass stock check for retrieved items
                discount: item.discount || 0
            };
        });

        setCart(remappedItems);
        setEditingSaleId(sale.id);
        // Calculate effective total from remaining items/quantities to exclude refunded/damaged values
        const effectiveTotal = remappedItems.reduce((sum, item) => {
            const finalPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
            return sum + (finalPrice * item.quantity);
        }, 0);
        setOriginalSaleTotal(sale.totalAmount);
        setReturnDeduction(sale.totalAmount - effectiveTotal);

        // Fetch linked vouchers (if any, from previous returns)
        try {
            const vouchers = await fetchVouchersBySaleId(sale.id);
            setExchangeVouchers(vouchers);
        } catch (e) {
            console.error("Error fetching vouchers for exchange:", e);
        }

        // Modal closed by component
        showAlert(`Bill #${sale.id} Loaded for Editing.`, 'success');
    };

    const handleCancelEdit = () => {
        setCart([]);
        setEditingSaleId(null);
        setOriginalSaleTotal(0);
        setExchangeVouchers([]);
        setPartialVoucher(null);
        setReturnDeduction(0);
        showAlert("Edit Cancelled. Cart Cleared.", 'success');
    };

    const handlePrintReceipt = (serverSale) => {
        printReceipt(serverSale);
    };

    const handleCheckout = async (method, cashGiven = 0) => {
        if (cart.length === 0) return;

        let finalPaymentMethod = method;
        if (partialVoucher && !method.startsWith('VOUCHER')) {
            // Recalculate distinctively for the payload
            const ded = calculateVoucherDeduction(partialVoucher.balance);
            finalPaymentMethod = `VOUCHER_PARTIAL:${partialVoucher.code}:${ded}|${method}`;
        }

        const saleData = {
            storeId: selectedStoreId,
            items: cart.map(item => ({
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount || 0
            })),
            totalAmount: total,
            paymentMethod: finalPaymentMethod,
            discount: discount
        };

        try {
            let response;
            // Recalculate dynamic values to ensure consistency
            const currentVoucherDeduction = partialVoucher ? calculateVoucherDeduction(partialVoucher.balance) : 0;
            const amountToPay = editingSaleId
                ? Math.max(0, total - (originalSaleTotal - returnDeduction) - currentVoucherDeduction)
                : Math.max(0, total - currentVoucherDeduction);

            if (editingSaleId) {
                response = await updateSale(editingSaleId, saleData);
                handlePrintReceipt({
                    ...response,
                    change: cashGiven - amountToPay,
                    cashGiven: cashGiven,
                    totalAmount: total,
                    subtotal: subtotal,
                    discountPercent: discount,
                    items: saleData.items.map((it, idx) => ({ ...it, productName: cart[idx].name }))
                });
                setEditingSaleId(null);
                setCart([]);
                setDiscount(0);
                setOriginalSaleTotal(0);
                setReturnDeduction(0);
                setExchangeVouchers([]);
                setPartialVoucher(null);
                showAlert("Bill Updated Successfully", "success");
            } else {
                response = await createSale(saleData);
                const printItems = saleData.items.map((it, idx) => ({ ...it, productName: cart[idx].name }));
                handlePrintReceipt({
                    ...response,
                    change: cashGiven - amountToPay,
                    cashGiven: cashGiven,
                    totalAmount: total,
                    subtotal: subtotal,
                    discountPercent: discount,
                    items: printItems
                });
                setCart([]);
                setDiscount(0);
                setPartialVoucher(null); // Reset partial
                showAlert("Sale Completed Successfully", "success");
            }
            await refetch();
        } catch (error) {
            console.error("Sale Error:", error);
            showAlert("Failed to process sale. Please try again.", "error");
        }
    };


    const closeSuccessModal = () => {
        setIsSuccessModalOpen(false);
        if (searchInputRef.current) searchInputRef.current.focus();
    };

    // Removed client-side filtering logic


    // Display whatever is in 'products' state (already paged/searched)
    const displayedProducts = products;

    const [isCashModalOpen, setIsCashModalOpen] = useState(false);

    const handleCashClick = () => {
        setIsCashModalOpen(true);
    };

    const handleCashPaymentComplete = (cash) => {
        handleCheckout('CASH', cash);
        setIsCashModalOpen(false);
    };

    // Helper to calculate how much of the voucher determines
    const calculateVoucherDeduction = (balance) => {
        if (!balance) return 0;
        // The amount needed to be paid by the user (before voucher)
        const netPayable = editingSaleId
            ? Math.max(0, total - (originalSaleTotal - returnDeduction))
            : total;
        return Math.min(balance, netPayable);
    };

    const appliedVoucherAmount = partialVoucher ? calculateVoucherDeduction(partialVoucher.balance) : 0;

    const amountToPay = editingSaleId
        ? Math.max(0, total - (originalSaleTotal - returnDeduction) - appliedVoucherAmount)
        : Math.max(0, total - appliedVoucherAmount);




    const [isCartIconHovered, setIsCartIconHovered] = useState(false);
    const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);

    const handleClearCart = () => {
        if (cart.length === 0) return;
        setIsClearCartModalOpen(true);
    };

    const confirmClearCart = () => {
        setCart([]);
        setDiscount(0);
        setPartialVoucher(null);
        // If editing, clear edit state too
        if (editingSaleId) {
            setEditingSaleId(null);
            setOriginalSaleTotal(0);
            setReturnDeduction(0);
            setExchangeVouchers([]);
        }
        setIsClearCartModalOpen(false);
        showAlert("Cart Cleared", "success");
    };

    return (
        <div className="layout" style={{ height: '100vh', gap: '1rem', padding: '1rem' }}>
            {/* Product Grid */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {isCashier ? (
                        <button
                            className="btn"
                            onClick={() => setIsLogoutModalOpen(true)}
                            style={{ padding: '0.5rem', backgroundColor: 'var(--danger)', color: 'white' }}
                            title="Log Out"
                        >
                            <LogOut size={24} />
                        </button>
                    ) : (
                        <button
                            className="btn"
                            onClick={() => navigate('/')}
                            style={{ padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            title="Back to Dashboard"
                        >
                            <Home size={24} />
                        </button>
                    )}
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-secondary)' }} />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Scan barcode or search product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                            style={{ paddingLeft: '2.8rem', fontSize: '1.1rem', width: '100%' }}
                        />
                    </div>
                </div >

                <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {displayedProducts.map(product => (
                        <div key={product.id} className="card" onClick={() => addToCart(product)} style={{
                            cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            opacity: product.stock > 0 ? 1 : 0.6,
                            backgroundColor: product.stock > 0 ? 'var(--bg-secondary)' : 'var(--bg-tertiary)'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{product.name}</div>
                                {product.barcode && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
                                        #{product.barcode}
                                    </div>
                                )}
                                <div style={{ color: product.stock > 0 ? 'var(--text-secondary)' : 'var(--danger)', fontSize: '0.9rem' }}>
                                    {product.stock > 0 ? `Stock: ${product.stock} ` : 'Out of Stock'}
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                Rs. {product.price?.toFixed(2)}
                            </div>
                        </div>
                    ))}
                    {/* Load More Button if more pages exist */}
                    {currentPage < totalPages && (
                        <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>



                            <button
                                className="btn"
                                onClick={() => {
                                    const nextPage = currentPage + 1;
                                    setCurrentPage(nextPage);
                                    setCurrentPage(nextPage);
                                }}
                                style={{ width: '100%', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                            >
                                {loading ? 'Loading...' : 'Load More Products...'}
                            </button>
                        </div>
                    )}
                </div>
            </div >

            {/* Cart / Receipt */}
            <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                            style={{
                                cursor: cart.length > 0 ? 'pointer' : 'default',
                                transition: 'transform 0.3s ease-in-out',
                                transform: isCartIconHovered && cart.length > 0 ? 'rotateY(180deg)' : 'rotateY(0deg)',
                                display: 'inline-block'
                            }}
                            onMouseEnter={() => setIsCartIconHovered(true)}
                            onMouseLeave={() => setIsCartIconHovered(false)}
                            onClick={handleClearCart}
                            title={cart.length > 0 ? "Clear Cart" : "Cart is Empty"}
                        >
                            {isCartIconHovered && cart.length > 0 ? (
                                <Trash2 size={36} color="var(--danger)" />
                            ) : (
                                <ShoppingCart size={36} />
                            )}
                        </div>
                        {editingSaleId && <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Editing #{editingSaleId}</h2>}
                        {editingSaleId && (
                            <button className="btn" onClick={handleCancelEdit} style={{ fontSize: '0.8rem', backgroundColor: 'var(--danger)', color: 'white', padding: '0.2rem 0.5rem' }}>
                                Cancel
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>




                        <button
                            className="btn"
                            onClick={handleRetrieveClick}
                            title="Retrieve Bill for Exchange (Item to Item)"
                            style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                        >
                            <RefreshCw size={18} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>EXCHANGE</span>
                        </button>

                        <button
                            className="btn"
                            onClick={() => { setReturnBillId(''); setReturnSaleData(null); setCreatedVoucher(null); setIsReturnModalOpen(true); }}
                            title="Process Damage Return"
                            style={{ border: '1px solid var(--danger)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem' }}
                        >
                            <AlertTriangle size={18} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>RETURN</span>
                        </button>

                        <button
                            className="btn"
                            onClick={() => setIsHoldModalOpen(true)}
                            title="Recall Held Sales"
                            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)', padding: '0.5rem' }}
                        >
                            <Clock size={18} />
                            {heldSales.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-8px', right: '-8px',
                                    backgroundColor: 'var(--accent-color)', color: 'white',
                                    borderRadius: '50%', width: '18px', height: '18px',
                                    fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center'
                                }}>
                                </span>
                            )}
                        </button>

                        {/* Notification Bell */}
                        <div style={{ position: 'relative' }}>
                            <button
                                className="btn"
                                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                                style={{ position: 'relative', border: '1px solid var(--border-color)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Bell size={18} />
                                {notifications.length > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '-5px', right: '-5px',
                                        backgroundColor: 'var(--danger)', color: 'white',
                                        fontSize: '0.7rem', fontWeight: 'bold',
                                        borderRadius: '50%', width: '16px', height: '16px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {notifications.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotificationDropdown && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0,
                                    backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    width: '250px', zIndex: 50, marginTop: '0.5rem'
                                }}>
                                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
                                        Approved Returns
                                    </div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                No updates
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div
                                                    key={notif.saleId}
                                                    onClick={() => handleNotificationClick(notif.saleId)}
                                                    style={{
                                                        padding: '0.75rem', borderBottom: '1px solid var(--border-color)',
                                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                        backgroundColor: 'var(--bg-tertiary)' // highlight
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Bill #{notif.saleId}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>{notif.count} Item(s) Verified</div>
                                                    </div>
                                                    <Ticket size={16} />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                            Cart is empty
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {item.discount > 0 ? (
                                            <>
                                                <span style={{ textDecoration: 'line-through', marginRight: '0.5rem' }}>Rs. {item.price}</span>
                                                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                                    Rs. {(item.price * (1 - item.discount / 100)).toFixed(2)}
                                                </span>
                                                <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--accent-color)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>
                                                    -{item.discount}%
                                                </span>
                                            </>
                                        ) : (
                                            `Rs.${item.price} `
                                        )}
                                        {' '}x {item.quantity}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button className="btn" onClick={() => updateQuantity(item.id, -1)} style={{ padding: '0.2rem', backgroundColor: 'var(--bg-tertiary)' }}><Minus size={14} /></button>
                                    <span>{item.quantity}</span>
                                    <button className="btn" onClick={() => updateQuantity(item.id, 1)} style={{ padding: '0.2rem', backgroundColor: 'var(--bg-tertiary)' }}><Plus size={14} /></button>
                                    <button className="btn" onClick={() => removeFromCart(item.id)} style={{ color: 'var(--danger)', padding: '0.2rem' }}><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ padding: '1.5rem', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 1rem 1rem' }}>

                    <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.8rem', fontWeight: 'bold' }}>
                            <span>Total</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span>Rs. {total.toFixed(2)}</span>
                                {subtotal >= (parseFloat(posSettings['discount_min_bill_amount']) || 10000) && !editingSaleId && (
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            if (showDiscountInput || discount > 0) {
                                                setDiscount(0);
                                                setShowDiscountInput(false);
                                            } else {
                                                setShowDiscountInput(true);
                                            }
                                        }}
                                        style={{
                                            padding: '0.5rem',
                                            borderRadius: '50%',
                                            backgroundColor: showDiscountInput || discount > 0 ? 'var(--accent-color)' : 'var(--bg-secondary)',
                                            color: showDiscountInput || discount > 0 ? 'white' : 'var(--text-secondary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title="Apply Full Bill Discount"
                                    >
                                        <Tag size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Discount Input (Toggled) */}
                        {(showDiscountInput || discount > 0) && subtotal >= (parseFloat(posSettings['discount_min_bill_amount']) || 10000) && !editingSaleId && (
                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    Discount (Max {parseFloat(posSettings['discount_max_percent']) || 0}%):
                                </span>
                                <input
                                    ref={discountInputRef}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount === 0 ? '' : discount}
                                    onChange={(e) => {
                                        let val = parseFloat(e.target.value);
                                        const maxP = parseFloat(posSettings['discount_max_percent']) || 0;
                                        if (isNaN(val) || val < 0) val = 0;
                                        if (val > maxP) val = maxP;
                                        setDiscount(val);
                                    }}
                                    placeholder="0%"
                                    style={{ width: '70px', padding: '0.3rem', textAlign: 'right', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}
                                />
                                {discount > 0 && (
                                    <span style={{ fontSize: '0.9rem', color: 'var(--success)', minWidth: '80px', textAlign: 'right' }}>
                                        - Rs. {(subtotal * discount / 100).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {partialVoucher && (
                        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px dashed var(--warning)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: 'var(--warning-text)' }}>
                                <div>
                                    <span>Voucher Applied ({partialVoucher.code})</span>
                                    {partialVoucher.balance !== undefined && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            (Remaining Balance: Rs. {(partialVoucher.balance - appliedVoucherAmount).toFixed(2)})
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>- Rs. {appliedVoucherAmount.toFixed(2)}</span>
                                    <button onClick={() => setPartialVoucher(null)} className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.2rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                        <XCircle size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)' }}>
                                <span>Balance Due</span>
                                <span>Rs. {amountToPay.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {editingSaleId || partialVoucher ? (
                            <div style={{ width: '100%' }}>
                                {/* Exchange Info */}
                                <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Original Bill:</span>
                                        <span>Rs. {originalSaleTotal.toFixed(2)}</span>
                                    </div>
                                    {returnDeduction > 0 && !partialVoucher && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', fontSize: '0.85rem' }}>
                                            <span>Less Returns:</span>
                                            <span>- Rs. {returnDeduction.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '0.5rem', color: total >= (originalSaleTotal - returnDeduction) ? 'var(--text-primary)' : 'var(--danger)' }}>
                                        <span>{total >= (originalSaleTotal - returnDeduction) ? 'Balance to Pay:' : 'Credit Remaining:'}</span>
                                        <span>Rs. {total >= (originalSaleTotal - returnDeduction) ? amountToPay.toFixed(2) : Math.abs(total - (originalSaleTotal - returnDeduction)).toFixed(2)}</span>
                                    </div>
                                    {total < (originalSaleTotal - returnDeduction) && (
                                        <div style={{ color: 'var(--danger)', marginTop: '0.5rem', fontWeight: 'bold' }}>
                                            * Add more items to utilize credit. No cash refunds.
                                        </div>
                                    )}
                                </div>

                                {/* Available Vouchers for Exchange */}
                                {exchangeVouchers.length > 0 && !partialVoucher && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        {exchangeVouchers.map(v => (
                                            <button
                                                key={v.code}
                                                className="btn"
                                                onClick={() => {
                                                    const deduction = Math.min(v.currentBalance, total); // Use total, as amountToPay might be skewed if we are just starting. Actually Math.min(balance, total) is the rule.
                                                    setPartialVoucher({ code: v.code, amount: deduction, balance: v.currentBalance });
                                                    showAlert(`Voucher ${v.code} Applied`, "success");
                                                }}
                                                style={{ width: '100%', backgroundColor: 'var(--accent-color)', color: 'white', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
                                                title={`Use Return Voucher: ${v.code}`}
                                            >
                                                <Ticket size={18} /> Apply Voucher ({v.code}) - Rs. {v.currentBalance.toFixed(2)}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {amountToPay > 0 ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleCashClick}
                                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '0.9rem' }}
                                        >
                                            <Banknote size={18} /> CASH
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => handleCheckout('CARD')}
                                            style={{ flex: 1, backgroundColor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '0.9rem' }}
                                        >
                                            <CreditCard size={18} /> CARD
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => setIsVoucherModalOpen(true)}
                                            style={{ flex: 1, backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '0.9rem' }}
                                        >
                                            <Ticket size={18} /> VOUCHER
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => handleCheckout('CASH', 0)}
                                        disabled={total < (originalSaleTotal - returnDeduction) || (partialVoucher && partialVoucher.balance > appliedVoucherAmount) || (exchangeVouchers.length > 0 && !partialVoucher)}
                                        style={{
                                            width: '100%',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem',
                                            backgroundColor: (total >= (originalSaleTotal - returnDeduction) && !(partialVoucher && partialVoucher.balance > appliedVoucherAmount) && !(exchangeVouchers.length > 0 && !partialVoucher)) ? 'var(--warning)' : 'var(--danger)',
                                            color: (total >= (originalSaleTotal - returnDeduction) && !(partialVoucher && partialVoucher.balance > appliedVoucherAmount) && !(exchangeVouchers.length > 0 && !partialVoucher)) ? 'black' : 'white',
                                            cursor: (total >= (originalSaleTotal - returnDeduction) && !(partialVoucher && partialVoucher.balance > appliedVoucherAmount) && !(exchangeVouchers.length > 0 && !partialVoucher)) ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        {total >= (originalSaleTotal - returnDeduction) ? (
                                            <>
                                                {exchangeVouchers.length > 0 && !partialVoucher ? (
                                                    <>
                                                        <AlertTriangle size={20} /> Apply Return Voucher
                                                    </>
                                                ) : (
                                                    <>
                                                        {partialVoucher && partialVoucher.balance > appliedVoucherAmount ? (
                                                            // Voucher has unused balance
                                                            <>
                                                                <AlertTriangle size={20} /> Add Items (Unused Voucher: Rs. {(partialVoucher.balance - appliedVoucherAmount).toFixed(2)})
                                                            </>
                                                        ) : (
                                                            // All good to update
                                                            <>
                                                                <RotateCcw size={20} /> UPDATE BILL
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            // Credit due
                                            <>
                                                <AlertTriangle size={20} /> Add Items (Credit: Rs. {Math.abs(total - (originalSaleTotal - returnDeduction)).toFixed(2)})
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                        ) : (
                            <>
                                <button className="btn btn-primary" onClick={handleCashClick} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '0.9rem' }}>
                                    <Banknote size={18} /> CASH
                                </button>
                                <button className="btn" onClick={() => handleCheckout('CARD')} style={{ flex: 1, backgroundColor: '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '0.9rem' }}>
                                    <CreditCard size={18} /> CARD
                                </button>
                                <button className="btn" onClick={() => setIsVoucherModalOpen(true)} style={{ flex: 1, backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '1rem', fontSize: '0.9rem' }}>
                                    <Ticket size={18} /> VOUCHER
                                </button>
                                <button className="btn" onClick={handleHoldSale} title="Hold / Park Sale" style={{ width: '3.5rem', flex: '0 0 auto', backgroundColor: 'var(--warning)', color: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0', fontSize: '0.9rem' }}>
                                    <PauseCircle size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div >

            {/* Cash Payment Modal */}
            <CashPaymentModal
                isOpen={isCashModalOpen}
                onClose={() => setIsCashModalOpen(false)}
                total={total}
                originalSaleTotal={originalSaleTotal}
                editingSaleId={editingSaleId}
                amountToPay={amountToPay}
                onPaymentComplete={handleCashPaymentComplete}
            />

            {/* Clear Cart Confirmation Modal */}
            <ClearCartModal
                isOpen={isClearCartModalOpen}
                onClose={() => setIsClearCartModalOpen(false)}
                onConfirm={confirmClearCart}
                itemCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
            />

            {/* Success Modal */}
            <PaymentSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={closeSuccessModal}
                lastSaleTotal={lastSaleTotal}
            />

            {/* Held Sales Modal */}
            <HeldSalesModal
                isOpen={isHoldModalOpen}
                onClose={() => setIsHoldModalOpen(false)}
                heldSales={heldSales}
                onResume={handleRecallSale}
                onDiscard={handleDiscardHold}
            />

            {/* Logout Modal */}
            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                title="Confirm Logout"
            >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{
                        width: '60px', height: '60px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--danger)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <LogOut size={32} />
                    </div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Ready to Leave?</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Are you sure you want to end your current session?
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            className="btn"
                            onClick={() => setIsLogoutModalOpen(false)}
                            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', width: '120px' }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn"
                            onClick={confirmLogout}
                            style={{ backgroundColor: 'var(--danger)', color: 'white', width: '120px' }}
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Retrieve Bill Modal */}
            <RetrieveBillModal
                isOpen={isRetrieveModalOpen}
                onClose={() => setIsRetrieveModalOpen(false)}
                onRetrieve={handleBillRetrieved}
                showAlert={showAlert}
            />

            {/* Return Processing Modal */}
            <DamageReturnModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                showAlert={showAlert}
                initialBillId={returnBillId}
                onVoucherIssued={(voucher) => {
                    // Manual Apply: Add to available exchange vouchers list
                    setExchangeVouchers(prev => [...prev, { ...voucher, currentBalance: voucher.amount }]);
                    showAlert("Voucher Issued! You can now apply it to this bill.", "success");
                }}
            />

            {/* Voucher Payment Modal */}
            <VoucherPaymentModal
                isOpen={isVoucherModalOpen}
                onClose={() => setIsVoucherModalOpen(false)}
                total={total}
                amountDue={amountToPay}
                onApplyVoucher={(voucher) => {
                    const deduction = Math.min(voucher.currentBalance, total);
                    setPartialVoucher({ code: voucher.code, amount: deduction, balance: voucher.currentBalance });
                    setIsVoucherModalOpen(false);
                    showAlert(`Voucher Applied. Balance Due: Rs. ${(Math.max(0, amountToPay - deduction)).toFixed(2)}`);
                }}
            />
        </div >
    );
};

export default POS;
