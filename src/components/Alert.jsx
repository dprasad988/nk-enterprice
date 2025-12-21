import React, { useEffect } from 'react';

const Alert = ({ message, type = 'error', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    if (!message) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: type === 'success' ? '#22c55e' : '#ef4444',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 2000,
            fontWeight: 'bold',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'slideDown 0.3s ease-out'
        }}>
            <div style={{ backgroundColor: 'white', borderRadius: '50%', padding: '0.2rem', display: 'flex', width: '24px', height: '24px', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ color: type === 'success' ? '#22c55e' : '#ef4444', fontWeight: 'bold', fontSize: '1.2rem', lineHeight: 1 }}>!</span>
            </div>
            {message}
        </div>
    );
};

export default Alert;
