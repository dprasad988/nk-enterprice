import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { fetchProducts } from '../api/products';

const Notifications = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        getProducts();
    }, []);

    const getProducts = async () => {
        try {
            const data = await fetchProducts();
            setProducts(data);
            generateNotifications(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products", error);
            setLoading(false);
        }
    };

    const generateNotifications = (productsList) => {
        const newNotifications = [];

        // Low Stock Alerts
        const lowStockItems = productsList.filter(p => p.stock <= 10);
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

        // Add dummy system notification
        newNotifications.push({
            id: 'sys-welcome',
            type: 'info',
            title: 'Welcome',
            message: 'Welcome to NK Enerprice POS System. System is running smoothly.',
            date: new Date().toISOString()
        });

        setNotifications(newNotifications);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'danger': return <AlertTriangle className="text-red-500" />;
            case 'warning': return <AlertTriangle className="text-amber-500" />;
            case 'success': return <CheckCircle className="text-green-500" />;
            default: return <Info className="text-blue-500" />;
        }
    };

    return (
        <div className="p-6">


            {loading ? (
                <div>Loading notifications...</div>
            ) : (
                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="text-center text-stone-400 py-10">
                            No new notifications
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className="card" style={{
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                borderLeft: `4px solid ${notif.type === 'danger' ? '#ef4444' : (notif.type === 'warning' ? '#f59e0b' : '#3b82f6')}`,
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {getIcon(notif.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>{notif.title}</h3>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {new Date(notif.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{notif.message}</p>
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
