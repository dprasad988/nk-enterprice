import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronDown } from 'lucide-react';

const Header = () => {
    const { selectedStoreId, setSelectedStoreId, stores, role, userStoreName } = useStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const username = localStorage.getItem('username') || 'User';
    const isOwner = role === 'OWNER';
    const location = useLocation();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getPageTitle = (pathname) => {
        if (pathname === '/') return 'Dashboard';
        if (pathname === '/pos') return 'POS';
        if (pathname === '/products') return 'Product List';
        if (pathname === '/sales') return 'Sales List';
        if (pathname === '/purchases') return 'Purchases';
        if (pathname === '/reports') return 'Reports';
        if (pathname === '/users') return 'User Management';
        if (pathname === '/notifications') return 'Notifications';
        if (pathname === '/settings') return 'Settings';
        if (pathname === '/damage-requests') return 'Damages';
        return 'Overview';
    };

    const pageTitle = getPageTitle(location.pathname);

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            {/* Left Side: Page Title */}
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {pageTitle}
            </div>

            {/* Right Side: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                    {currentTime.toLocaleString()}
                </div>
                <div style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>|</div>
                <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                    Welcome, <b>{username}</b>
                </div>
                {!isOwner && (
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-color)', backgroundColor: 'var(--bg-secondary)', padding: '0.4rem 0.8rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                        {userStoreName}
                    </div>
                )}

                {isOwner && (
                    <div style={{ marginLeft: '1rem', position: 'relative', display: 'inline-block' }}>
                        <select
                            value={selectedStoreId}
                            onChange={(e) => setSelectedStoreId(Number(e.target.value))}
                            style={{
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                MozAppearance: 'none',
                                padding: '0.6rem 2.5rem 0.6rem 1rem', // Extra right padding for icon
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--accent-color)',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                paddingRight: '2.5rem',
                                minWidth: '150px' // Ensure enough width for typical store names
                            }}
                        >
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            style={{
                                position: 'absolute',
                                right: '1rem', // "Little bit left side" -> more padding from right
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none',
                                color: 'var(--accent-color)'
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
