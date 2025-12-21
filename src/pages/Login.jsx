import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { login } from '../api/auth';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await login(username, password);

            const { token, role, storeId, username: user, storeName } = data;

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('username', user);
            localStorage.setItem('storeName', storeName);

            if (storeId) localStorage.setItem('storeId', storeId);
            else localStorage.removeItem('storeId');

            // Redirect based on role
            if (role === 'CASHIER') {
                window.location.href = '/pos';
            } else {
                window.location.href = '/';
            }

        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
            color: 'white',
            zIndex: 9999
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '380px',
                padding: '1.5rem',
                backgroundColor: 'rgba(31, 41, 55, 0.7)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--accent-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 0.75rem auto',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                    }}>
                        <Lock size={24} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>NK Enterprice</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Sign in to your account</p>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        textAlign: 'center',
                        fontSize: '0.85rem'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.95rem'
                                }}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="password"
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.6rem 0.6rem 2.2rem',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.95rem'
                                }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        Sign In
                    </button>
                    <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Contact administrator for access issues
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
