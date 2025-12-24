import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, DollarSign, Settings, BarChart2, Bell, UserCog, ChevronDown, LogOut } from 'lucide-react';
import Modal from './Modal';
import { useProducts } from '../api/products';
import { usePendingReturns } from '../api/returns';
import { logout } from '../api/auth';

import logo from '../assets/nk_logo.png';

const Sidebar = () => {
    const [notificationCount, setNotificationCount] = useState(0);
    const [isProductsOpen, setIsProductsOpen] = useState(false);
    const [isSalesOpen, setIsSalesOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const role = localStorage.getItem('role');
    const location = useLocation();
    const navigate = useNavigate();

    // Use Custom Hook for polling
    const { data: products = [] } = useProducts();
    const { data: pendingReturns = [] } = usePendingReturns(role === 'OWNER' ? null : localStorage.getItem('storeId'));

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = async () => {
        await logout();
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('storeId');
        navigate('/login');
    };

    useEffect(() => {
        const updateCount = () => {
            const data = products || [];
            // Get read notifications from local storage
            let readNotifs = JSON.parse(localStorage.getItem('read_notifications') || '[]');
            let hasChanges = false;

            // 1. Clean up "read" status for items that are no longer low on stock
            // This ensures if they go low again, they show up as new notifications
            data.forEach(item => {
                const notifId = `low-stock-${item.id}`;
                if (item.stock > 10 && readNotifs.includes(notifId)) {
                    readNotifs = readNotifs.filter(id => id !== notifId);
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                localStorage.setItem('read_notifications', JSON.stringify(readNotifs));
            }

            // 2. Calculate unread low stock alerts
            let unreadCount = 0;

            // Low Stock
            const lowStockItems = data.filter(p => p.stock <= 10);
            lowStockItems.forEach(item => {
                const notifId = `low-stock-${item.id}`;
                if (!readNotifs.includes(notifId)) {
                    unreadCount++;
                }
            });

            // System Welcome Message (id: 'sys-welcome')
            if (!readNotifs.includes('sys-welcome')) {
                unreadCount++;
            }

            // Pending Return Requests (Action Items)
            if (role !== 'CASHIER') {
                pendingReturns.forEach(req => {
                    if (!readNotifs.includes(`return-${req.id}`)) {
                        unreadCount++;
                    }
                });
            }

            setNotificationCount(unreadCount);
        };

        updateCount();

        // Listen both for storage updates and custom events for instant sidebar update
        const handleUpdate = () => updateCount();
        window.addEventListener('storage', handleUpdate);
        window.addEventListener('notificationStateChanged', handleUpdate);

        return () => {
            window.removeEventListener('storage', handleUpdate);
            window.removeEventListener('notificationStateChanged', handleUpdate);
        };
    }, [products, pendingReturns]);

    return (
        <div className="sidebar">
            <div className="sidebar-header" style={{ padding: '0.5rem 0.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                <img src={logo} alt="Enterprice" style={{ height: '40px', width: 'auto', objectFit: 'cover' }} />
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent-color)', letterSpacing: '0.5px' }}>Enterprice</span>
            </div>
            <nav>
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/pos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <ShoppingCart size={20} />
                    <span>POS</span>
                </NavLink>

                {/* Products Dropdown */}
                <div style={{ marginBottom: '0.5rem' }}>
                    <div
                        className={`nav-item ${location.pathname.includes('/products') || location.pathname.includes('/purchases') ? 'active' : ''}`}
                        onClick={() => setIsProductsOpen(!isProductsOpen)}
                        style={{ cursor: 'pointer', justifyContent: 'space-between', backgroundColor: (location.pathname.includes('/products') || location.pathname.includes('/purchases')) && !isProductsOpen ? 'var(--bg-tertiary)' : undefined }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Package size={20} />
                            <span>Products</span>
                        </div>
                        <ChevronDown size={16} style={{ transform: isProductsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>

                    {isProductsOpen && (
                        <div style={{ marginLeft: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                                <span>Product List</span>
                            </NavLink>
                            <NavLink to="/purchases" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                                <span>Purchases</span>
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Sales Dropdown */}
                <div style={{ marginBottom: '0.5rem' }}>
                    <div
                        className={`nav-item ${location.pathname.includes('/sales') || location.pathname.includes('/reports') ? 'active' : ''}`}
                        onClick={() => setIsSalesOpen(!isSalesOpen)}
                        style={{ cursor: 'pointer', justifyContent: 'space-between', backgroundColor: (location.pathname.includes('/sales') || location.pathname.includes('/reports')) && !isSalesOpen ? 'var(--bg-tertiary)' : undefined }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <DollarSign size={20} />
                            <span>Sales</span>
                        </div>
                        <ChevronDown size={16} style={{ transform: isSalesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </div>

                    {isSalesOpen && (
                        <div style={{ marginLeft: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                                <span>Sales List</span>
                            </NavLink>
                            <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                                <span>Reports</span>
                            </NavLink>
                            <NavLink to="/damage-requests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: '0.95rem', padding: '0.5rem 1rem' }}>
                                <span>Damages</span>
                            </NavLink>
                        </div>
                    )}
                </div>

                <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Bell size={20} />
                        <span>Notifications</span>
                    </div>
                    {notificationCount > 0 && (
                        <span style={{
                            backgroundColor: 'var(--danger)',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '1rem',
                            minWidth: '1.2rem',
                            textAlign: 'center'
                        }}>
                            {notificationCount}
                        </span>
                    )}
                </NavLink>

                {role === 'OWNER' && (
                    <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <UserCog size={20} />
                        <span>Users</span>
                    </NavLink>
                )}

                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={20} />
                    <span>Settings</span>
                </NavLink>

                <div
                    className="nav-item"
                    onClick={handleLogoutClick}
                    style={{ cursor: 'pointer', color: 'var(--danger)', marginTop: '0.5rem' }}
                >
                    <LogOut size={20} />
                    <span>Log Out</span>
                </div>

            </nav>
            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                Developed by <a href="https://dhammika-prasad.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--warning)', textDecoration: 'none' }}>Dhammika Prasad</a>
            </div>

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
        </div>
    );
};

export default Sidebar;
