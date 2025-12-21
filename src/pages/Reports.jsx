import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, AlertTriangle, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { fetchSales } from '../api/sales';
import { fetchProducts } from '../api/products';
import { useStore } from '../context/StoreContext';

const Reports = () => {
    const { selectedStoreId, role } = useStore();
    const isOwner = role === 'OWNER';
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'sales');
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to get Local Date String (YYYY-MM-DD)
    const getLocalDateString = (offsetDays = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - offsetDays);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    useEffect(() => {
        fetchData();
    }, [selectedStoreId]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    const fetchData = async () => {
        if (isOwner && !selectedStoreId) return;
        try {
            const storeFilter = selectedStoreId;
            const [salesData, productsData] = await Promise.all([
                fetchSales(storeFilter),
                fetchProducts(storeFilter)
            ]);
            setSales(salesData);
            setProducts(productsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching data", error);
            setLoading(false);
        }
    };

    const [salesGraphFilter, setSalesGraphFilter] = useState('last7days');

    // --- Sales Logic ---
    const getSalesData = () => {
        let dataPoints = [];

        if (salesGraphFilter === 'last7days') {
            dataPoints = new Array(7).fill(0).map((_, i) => {
                return getLocalDateString(i);
            }).reverse().map(date => ({
                name: date.slice(5),
                fullDate: date
            }));
        } else if (salesGraphFilter === 'last4weeks') {
            dataPoints = new Array(5).fill(0).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (i * 7));
                const day = d.getDay();
                const diff = d.getDate() - day;
                const weekStart = new Date(d.setDate(diff));
                const isoStr = weekStart.toISOString().split('T')[0];
                return { name: `Week ${isoStr.slice(5)}`, fullDate: isoStr };
            }).reverse();
        } else if (salesGraphFilter === 'last12months') {
            dataPoints = new Array(12).fill(0).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = d.toISOString().slice(0, 7);
                return { name: monthStr, fullDate: monthStr };
            }).reverse();
        } else if (salesGraphFilter === 'last5years') {
            dataPoints = new Array(5).fill(0).map((_, i) => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - i);
                const yearStr = d.getFullYear().toString();
                return { name: yearStr, fullDate: yearStr };
            }).reverse();
        }

        const chartData = dataPoints.map(point => {
            const periodSales = sales.filter(s => {
                if (salesGraphFilter === 'last7days') {
                    return s.saleDate.startsWith(point.fullDate);
                } else if (salesGraphFilter === 'last4weeks') {
                    const saleDate = new Date(s.saleDate);
                    const weekStart = new Date(point.fullDate);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return saleDate >= weekStart && saleDate < weekEnd;
                } else if (salesGraphFilter === 'last12months') {
                    return s.saleDate.startsWith(point.fullDate);
                } else if (salesGraphFilter === 'last5years') {
                    return s.saleDate.startsWith(point.fullDate);
                }
                return false;
            });

            const total = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);
            return { name: point.name, sales: total };
        });

        return chartData;
    };

    const totalSalesToday = sales
        .filter(s => s.saleDate.startsWith(getLocalDateString(0)))
        .reduce((sum, s) => sum + s.totalAmount, 0);

    // --- Stock Logic ---
    const lowStockItems = products.filter(p => p.stock <= p.alertLevel);
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
    const totalCostValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

    const [profitGraphFilter, setProfitGraphFilter] = useState('last7days');

    // --- Profit Logic ---
    const getProfitData = () => {
        const productCostMap = {};
        products.forEach(p => productCostMap[p.id] = p.costPrice || 0);

        let dataPoints = [];
        const today = new Date();

        if (profitGraphFilter === 'last7days') {
            dataPoints = new Array(7).fill(0).map((_, i) => {
                return getLocalDateString(i);
            }).reverse().map(date => ({
                name: date.slice(5),
                fullDate: date // keep full date for filtering
            }));
        } else if (profitGraphFilter === 'last4weeks') {
            // Actually user asked for "Weekly" - usually last 4-8 weeks. Let's do last 5 weeks for clean graph
            dataPoints = new Array(5).fill(0).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (i * 7));
                // Get start of week (Sunday)
                const day = d.getDay();
                const diff = d.getDate() - day; // adjust when day is sunday
                const weekStart = new Date(d.setDate(diff));
                const isoStr = weekStart.toISOString().split('T')[0];
                return { name: `Week ${isoStr.slice(5)}`, fullDate: isoStr, type: 'week' };
            }).reverse();
        } else if (profitGraphFilter === 'last12months') {
            dataPoints = new Array(12).fill(0).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = d.toISOString().slice(0, 7); // YYYY-MM
                return { name: monthStr, fullDate: monthStr, type: 'month' };
            }).reverse();
        } else if (profitGraphFilter === 'last5years') {
            dataPoints = new Array(5).fill(0).map((_, i) => {
                const d = new Date();
                d.setFullYear(d.getFullYear() - i);
                const yearStr = d.getFullYear().toString();
                return { name: yearStr, fullDate: yearStr, type: 'year' };
            }).reverse();
        }

        const chartData = dataPoints.map(point => {
            let periodProfit = 0;

            // Filter sales matching the period
            const matchingSales = sales.filter(s => {
                if (profitGraphFilter === 'last7days') {
                    return s.saleDate.startsWith(point.fullDate);
                } else if (profitGraphFilter === 'last4weeks') {
                    // Check if saleDate falls in that week
                    // Simple hack: check if sale date is between weekStart and weekStart+7
                    // But easier: new Date(s.saleDate) >= new Date(point.fullDate) && < +7 days
                    const saleDate = new Date(s.saleDate);
                    const weekStart = new Date(point.fullDate);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return saleDate >= weekStart && saleDate < weekEnd;
                } else if (profitGraphFilter === 'last12months') {
                    return s.saleDate.startsWith(point.fullDate);
                } else if (profitGraphFilter === 'last5years') {
                    return s.saleDate.startsWith(point.fullDate);
                }
                return false;
            });

            matchingSales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        const cost = productCostMap[item.productId] || 0;
                        periodProfit += (item.price - cost) * item.quantity;
                    });
                }
            });
            return { name: point.name, profit: periodProfit };
        });

        return chartData;
    };

    const calculateProfit = (period) => {
        const productCostMap = {};
        products.forEach(p => productCostMap[p.id] = p.costPrice || 0);

        let filteredSales = [];
        const today = new Date(); // Keep for object reference if needed, but strings are better

        if (period === 'today') {
            const dateStr = getLocalDateString(0);
            filteredSales = sales.filter(s => s.saleDate.startsWith(dateStr));
        } else if (period === 'week') {
            // Simple check: is date >= 7 days ago?
            // Converting saleDate string to Date object might assume UTC if "T" present without offset.
            // But usually "YYYY-MM-DDTHH:mm:ss" is treated as Local by Date.parse() in some browsers, or UTC in others.
            // Safe bet: Match string prefixes or simple compare if format is standard.
            // Let's rely on string compare for simple "last 7 days" ranges? No. 
            // Parsing:
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            filteredSales = sales.filter(s => new Date(s.saleDate) >= weekAgo);
        } else if (period === 'month') {
            const monthStr = getLocalDateString(0).slice(0, 7); // YYYY-MM
            filteredSales = sales.filter(s => s.saleDate.startsWith(monthStr));
        } else if (period === 'year') {
            const yearStr = getLocalDateString(0).slice(0, 4);
            filteredSales = sales.filter(s => s.saleDate.startsWith(yearStr));
        }

        let totalProfit = 0;
        filteredSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const cost = productCostMap[item.productId] || 0;
                    totalProfit += (item.price - cost) * item.quantity;
                });
            }
        });
        return totalProfit;
    };

    const renderSalesTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)' }}>Today's Sales</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs. {totalSalesToday.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)' }}>Total Transactions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{sales.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ height: '400px', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Sales Trends</h3>
                    <select
                        value={salesGraphFilter}
                        onChange={(e) => setSalesGraphFilter(e.target.value)}
                        style={{ width: 'auto', padding: '0.4rem', fontSize: '0.9rem' }}
                    >
                        <option value="last7days">Last 7 Days</option>
                        <option value="last4weeks">Last 5 Weeks</option>
                        <option value="last12months">Last 12 Months</option>
                        <option value="last5years">Last 5 Years</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSalesData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Bar dataKey="sales" fill="var(--accent-color)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="card">
                <h3>Recent Transactions</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Cashier</th>
                            <th>Payment</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.slice(0, 10).map(sale => (
                            <tr key={sale.id}>
                                <td>{new Date(sale.saleDate).toLocaleString()}</td>
                                <td>{sale.cashierName || 'Admin'}</td>
                                <td>{sale.paymentMethod}</td>
                                <td>Rs. {sale.totalAmount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderStockTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <Package size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)' }}>Inventory Value (Selling)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rs. {totalStockValue.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center gap-4">
                        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)' }}>Low Stock Items</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{lowStockItems.length}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>Current Inventory</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.stock}</td>
                                <td>Rs. {product.price.toFixed(2)}</td>
                                <td>Rs. {(product.stock * product.price).toFixed(2)}</td>
                                <td>
                                    <span style={{
                                        color: product.stock <= product.alertLevel ? 'var(--danger)' : 'var(--success)',
                                        fontWeight: 'bold'
                                    }}>
                                        {product.stock <= product.alertLevel ? 'Low Stock' : 'Good'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderLowStockTab = () => (
        <div className="card">
            <h3>Low Stock Alerts</h3>
            {lowStockItems.length === 0 ? (
                <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>No items are currently low on stock.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Current Stock</th>
                            <th>Alert Level</th>
                            <th>Supplier</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lowStockItems.map(product => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{product.stock}</td>
                                <td>{product.alertLevel}</td>
                                <td>{product.supplier || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderProfitTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Today's Profit</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                        Rs. {calculateProfit('today').toFixed(2)}
                    </div>
                </div>
                <div className="card">
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Weekly Profit</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        Rs. {calculateProfit('week').toFixed(2)}
                    </div>
                </div>
                <div className="card">
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monthly Profit</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                        Rs. {calculateProfit('month').toFixed(2)}
                    </div>
                </div>
                <div className="card">
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Yearly Profit</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                        Rs. {calculateProfit('year').toFixed(2)}
                    </div>
                </div>
            </div>

            <div className="card" style={{ height: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Profit Trends</h3>
                    <select
                        value={profitGraphFilter}
                        onChange={(e) => setProfitGraphFilter(e.target.value)}
                        style={{ width: 'auto', padding: '0.4rem', fontSize: '0.9rem' }}
                    >
                        <option value="last7days">Last 7 Days</option>
                        <option value="last4weeks">Last 5 Weeks</option>
                        <option value="last12months">Last 12 Months</option>
                        <option value="last5years">Last 5 Years</option>
                    </select>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getProfitData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" />
                        <YAxis stroke="var(--text-secondary)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                            itemStyle={{ color: 'var(--text-primary)' }}
                        />
                        <Bar dataKey="profit" fill="var(--success)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div>
            <div className="header-actions">

                <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    <button
                        className={`btn ${activeTab === 'sales' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('sales')}
                    >
                        Sales
                    </button>
                    <button
                        className={`btn ${activeTab === 'stock' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('stock')}
                    >
                        Stock
                    </button>
                    <button
                        className={`btn ${activeTab === 'lowstock' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('lowstock')}
                    >
                        Low Stock
                    </button>
                    <button
                        className={`btn ${activeTab === 'profit' ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab('profit')}
                    >
                        Profit
                    </button>
                </div>
            </div>

            {loading ? <p>Loading data...</p> : (
                <>
                    {activeTab === 'sales' && renderSalesTab()}
                    {activeTab === 'stock' && renderStockTab()}
                    {activeTab === 'lowstock' && renderLowStockTab()}
                    {activeTab === 'profit' && renderProfitTab()}
                </>
            )}
        </div>
    );
};

export default Reports;
