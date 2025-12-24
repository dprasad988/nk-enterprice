import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Users from './pages/Users';
import DamageRequests from './pages/DamageRequests';
import { StoreProvider } from './context/StoreContext';
import './styles.css';
import { useIdleTimer } from './hooks/useIdleTimer';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // If Cashier is trying to access restricted page, send to POS
        if (userRole === 'CASHIER') {
            return <Navigate to="/pos" replace />;
        }
        // Prevent infinite loop: if unauthorized for dashboard, don't redirect to dashboard!
        return <Navigate to="/login" replace />;
    }

    return children;
};

const Layout = () => {
    const location = useLocation();
    const isPOS = location.pathname === '/pos';
    const isLogin = location.pathname === '/login';

    if (isLogin) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
            </Routes>
        );
    }

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isLoggedIn = !!token;

    useIdleTimer({
        timeout: 36000000, // 10 Hours (Matches Token Expiry)
        onIdle: () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('storeId');
            window.location.href = '/login';
        },
        isActive: isLoggedIn
    });

    // Strict Redirect for Cashiers to prevent "Flash" of Dashboard
    if (isLoggedIn && role === 'CASHIER') {
        const restrictedPaths = ['/', '/products', '/sales', '/purchases', '/reports', '/users'];
        const isRestricted = restrictedPaths.some(path =>
            location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
        );

        if (isRestricted) {
            return <Navigate to="/pos" replace />;
        }
    }

    // Strict Redirect for Store Admin trying to access /users
    if (isLoggedIn && role === 'STORE_ADMIN' && location.pathname === '/users') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="layout">
            {!isPOS && isLoggedIn && <Sidebar />}
            <div className="main-content" style={isPOS ? { padding: 0 } : {}}>
                {!isPOS && isLoggedIn && <div className="sticky-header"><Header /></div>}
                <div className={!isPOS ? "page-content" : ""}>
                    <Routes>
                        <Route path="/" element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STORE_ADMIN']}>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/pos" element={
                            <ProtectedRoute>
                                <POS />
                            </ProtectedRoute>
                        } />
                        <Route path="/products" element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STORE_ADMIN']}>
                                <Products />
                            </ProtectedRoute>
                        } />
                        <Route path="/sales" element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STORE_ADMIN']}>
                                <Sales />
                            </ProtectedRoute>
                        } />
                        <Route path="/purchases" element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STORE_ADMIN']}>
                                <Purchases />
                            </ProtectedRoute>
                        } />
                        <Route path="/reports" element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STORE_ADMIN']}>
                                <Reports />
                            </ProtectedRoute>
                        } />
                        <Route path="/damage-requests" element={
                            <ProtectedRoute allowedRoles={['OWNER', 'STORE_ADMIN']}>
                                <DamageRequests />
                            </ProtectedRoute>
                        } />
                        <Route path="/users" element={
                            <ProtectedRoute allowedRoles={['OWNER']}>
                                <Users />
                            </ProtectedRoute>
                        } />
                        <Route path="/notifications" element={<Notifications />} />
                        <Route path="/settings" element={<Settings />} />
                        {/* Catch all redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};


import { AlertProvider } from './context/AlertContext';

function App() {
    return (
        <StoreProvider>
            <AlertProvider>
                <Router>
                    <Layout />
                </Router>
            </AlertProvider>
        </StoreProvider>
    );
}

export default App;
