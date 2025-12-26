import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '../api/dashboard';
import { useStore } from '../context/StoreContext';
import { SkeletonStatCard, SkeletonQuickActionCard, SkeletonChartCard, SkeletonListCard } from '../components/SkeletonCard';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: '50%', backgroundColor: `${color}20`, color: color }}>
            <Icon size={24} />
        </div>
        <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{title}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    // Consume global store state
    const { selectedStoreId, stores, role } = useStore();
    const isOwner = role === 'OWNER';

    // TanStack Query
    const { data: dashboardData, isLoading } = useDashboardStats(
        selectedStoreId !== 'ALL' ? selectedStoreId : undefined
    );

    const stats = {
        totalSales: dashboardData?.totalSales || 0,
        totalProfit: dashboardData?.totalProfit || 0,
        orders: dashboardData?.orders || 0,
        lowStock: dashboardData?.lowStock || 0,
        totalProducts: dashboardData?.totalProducts || 0,
        storeCount: dashboardData?.storeCount || 0
    };
    const chartData = dashboardData?.chartData || [];
    const storePerformanceData = dashboardData?.storePerformance || [];
    const topProducts = dashboardData?.topProducts || [];

    const loading = isLoading;

    if (loading && !stats.totalProducts) {
        return (
            <div className="fade-in">
                {/* Stat Cards Skeleton */}
                <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                    <SkeletonStatCard />
                </div>

                {/* Quick Reports Skeleton (Conditional Logic Match) */}
                {(!isOwner || selectedStoreId !== 'ALL') && (
                    <>
                        <div style={{ marginBottom: '1rem', height: '24px', width: '150px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }} />
                        <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                            <SkeletonQuickActionCard />
                            <SkeletonQuickActionCard />
                            <SkeletonQuickActionCard />
                            <SkeletonQuickActionCard />
                        </div>
                    </>
                )}

                {/* Charts & Lists Skeleton */}
                <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                    <SkeletonChartCard />
                    <SkeletonListCard />
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">


            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                <StatCard title="Total Sales" value={`Rs. ${stats.totalSales.toLocaleString()}`} icon={DollarSign} color="#22c55e" />

                {isOwner && selectedStoreId === 'ALL' ? (
                    <>
                        <StatCard title="Total Profit" value={`Rs. ${stats.totalProfit.toLocaleString()}`} icon={TrendingUp} color="#8b5cf6" />
                        <StatCard title="Active Stores" value={stats.storeCount} icon={Package} color="#f59e0b" />
                        <StatCard title="Total Orders" value={stats.orders} icon={ShoppingCart} color="#3b82f6" />
                    </>
                ) : (
                    <>
                        <StatCard title="Total Orders" value={stats.orders} icon={ShoppingCart} color="#3b82f6" />
                        <StatCard title="Low Stock Items" value={stats.lowStock} icon={AlertTriangle} color="#ef4444" />
                        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} color="#f59e0b" />
                    </>
                )}
            </div>

            {/* Quick Actions / Reports */}
            {(!isOwner || selectedStoreId !== 'ALL') && (
                <>
                    <h3 style={{ marginBottom: '1rem' }}>Quick Reports</h3>
                    <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
                        <button className="card center-content hover-scale" onClick={() => navigate('/reports?tab=sales')}>
                            <div className="icon-circle bg-blue"><DollarSign size={24} /></div>
                            <span className="font-medium">Daily Sales</span>
                        </button>
                        <button className="card center-content hover-scale" onClick={() => navigate('/reports?tab=stock')}>
                            <div className="icon-circle bg-orange"><Package size={24} /></div>
                            <span className="font-medium">Stock Report</span>
                        </button>
                        <button className="card center-content hover-scale" onClick={() => navigate('/reports?tab=lowstock')}>
                            <div className="icon-circle bg-red"><AlertTriangle size={24} /></div>
                            <span className="font-medium">Low Stock</span>
                        </button>
                        <button className="card center-content hover-scale" onClick={() => navigate('/sales')}>
                            <div className="icon-circle bg-green"><ShoppingCart size={24} /></div>
                            <span className="font-medium">Sales History</span>
                        </button>
                    </div>
                </>
            )}

            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>
                        {isOwner && selectedStoreId === 'ALL' ? 'Store Performance (Sales)' : 'Weekly Sales Overview'}
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={isOwner && selectedStoreId === 'ALL' ? storePerformanceData : chartData}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                            <TrendingUp size={20} />
                        </div>
                        <h3>Top Selling Products</h3>
                    </div>

                    {topProducts.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No sales data yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {topProducts.map((p, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: index < topProducts.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className={`rank-badge rank-${index + 1}`}>
                                            {index + 1}
                                        </span>
                                        <span style={{ fontWeight: '500' }}>{p.name}</span>
                                    </div>
                                    <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{p.quantity} Sold</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
