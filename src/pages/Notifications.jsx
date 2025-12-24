import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, CheckCircle, Info, Check, CornerDownLeft } from 'lucide-react';
import { useProducts } from '../api/products';
import { usePendingReturns } from '../api/returns';

const Notifications = () => {
    const [readNotifs, setReadNotifs] = useState([]);
    const navigate = useNavigate();
    const role = localStorage.getItem('role');

    // Use Custom Hook
    const { data: products = [], isLoading: loading } = useProducts();
    const { data: pendingReturns = [] } = usePendingReturns(role === 'OWNER' ? null : localStorage.getItem('storeId'));

    useEffect(() => {
        // Load read notifications
        const savedRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        setReadNotifs(savedRead);

        // Listen for standard custom events
        const handleUpdate = () => {
            const up = JSON.parse(localStorage.getItem('read_notifications') || '[]');
            setReadNotifs(up);
        };
        window.addEventListener('notificationStateChanged', handleUpdate);
        return () => window.removeEventListener('notificationStateChanged', handleUpdate);
    }, []);

    // Derive notifications
    const notifications = useMemo(() => {
        const list = products || [];
        const newNotifications = [];

        // Low Stock Alerts
        const lowStockItems = list.filter(p => p.stock <= 10);
        lowStockItems.forEach(item => {
            const isOutOfStock = item.stock === 0;
            newNotifications.push({
                id: `low-stock-${item.id}`,
                type: isOutOfStock ? 'danger' : 'warning',
                title: isOutOfStock ? 'Out of Stock Alert' : 'Low Stock Alert',
                message: `Product "${item.name}" is ${isOutOfStock ? 'out of stock' : 'running low'}. Current stock: ${item.stock}`,
                date: new Date().toISOString()
            });
        });

        // Pending Damage Returns
        if (role !== 'CASHIER') {
            pendingReturns.forEach(req => {
                newNotifications.push({
                    id: `return-${req.id}`,
                    type: 'warning',
                    title: 'New Damage Return Request',
                    message: `Item: ${req.productName} (x${req.quantity}). Reason: ${req.reason}`,
                    date: req.returnDate || new Date().toISOString(),
                    actionLabel: 'Review Request',
                    onAction: () => navigate('/damage-requests')
                });
            });
        }

        // Add dummy system notification
        newNotifications.push({
            id: 'sys-welcome',
            type: 'info',
            title: 'Welcome',
            message: 'Welcome to NK Enerprice POS System. System is running smoothly.',
            date: new Date().toISOString()
        });

        // Map read status
        const mappedNotifications = newNotifications.map(n => ({
            ...n,
            isRead: readNotifs.includes(n.id)
        }));

        // Sort: Unread first
        mappedNotifications.sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1));

        return mappedNotifications;
    }, [products, readNotifs]);

    const handleMarkAsRead = (id) => {
        const updatedRead = [...readNotifs, id];
        setReadNotifs(updatedRead);
        localStorage.setItem('read_notifications', JSON.stringify(updatedRead));
        window.dispatchEvent(new Event('notificationStateChanged'));
    };

    const handleMarkAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        const updatedRead = [...readNotifs, ...allIds];
        const uniqueRead = [...new Set(updatedRead)];

        setReadNotifs(uniqueRead);
        localStorage.setItem('read_notifications', JSON.stringify(uniqueRead));
        window.dispatchEvent(new Event('notificationStateChanged'));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} color="#ef4444" />;
            case 'warning': return <AlertTriangle size={24} color="#f59e0b" />;
            case 'success': return <CheckCircle size={24} color="#10b981" />;
            default: return <Info size={24} color="#3b82f6" />;
        }
    };

    return (
        <div className="p-6">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Notifications</h2>
                {notifications.some(n => !n.isRead) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                        <Check size={16} /> Mark All Read
                    </button>
                )}
            </div>

            {loading ? (
                <div>Loading notifications...</div>
            ) : (
                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-stone-400 py-10" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <Bell size={48} style={{ opacity: 0.2 }} />
                            <span>No new notifications</span>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className="card" style={{
                                padding: '1rem',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                borderLeft: `4px solid ${notif.type === 'danger' ? '#ef4444' : (notif.type === 'warning' ? '#f59e0b' : '#3b82f6')}`,
                                marginBottom: '0.5rem',
                                position: 'relative',
                                background: notif.isRead ? '#f3f4f6' : 'white',
                                border: notif.isRead ? '1px solid #e5e7eb' : '1px solid transparent',
                                boxShadow: notif.isRead ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                                color: 'black'
                            }}>
                                <div style={{ marginTop: '2px' }}>
                                    {getIcon(notif.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: notif.isRead ? '#6b7280' : 'black' }}>
                                            {notif.title}
                                            {notif.isRead && <span style={{ marginLeft: '10px', fontSize: '0.7rem', backgroundColor: '#e5e7eb', padding: '2px 6px', borderRadius: '4px', color: '#6b7280', textTransform: 'uppercase' }}>Read</span>}
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                            {new Date(notif.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: notif.isRead ? '#6b7280' : '#374151' }}>{notif.message}</p>

                                    {!notif.isRead && (
                                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="btn"
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: '#e5e7eb',
                                                    color: '#374151',
                                                    border: '1px solid #d1d5db'
                                                }}
                                            >
                                                Mark as Read
                                            </button>
                                        </div>
                                    )}

                                    {notif.actionLabel && (
                                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={notif.onAction}
                                                className="btn btn-primary"
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                                                }}
                                            >
                                                <CornerDownLeft size={14} /> {notif.actionLabel}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Notifications;
