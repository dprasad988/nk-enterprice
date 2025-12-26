import React from 'react';
import { useLoading } from '../context/LoadingContext';

const LoadingOverlay = () => {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(2px)'
        }}>
            <div className="spinner" style={{
                width: '50px',
                height: '50px',
                border: '5px solid var(--bg-tertiary)',
                borderTop: '5px solid var(--accent-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default LoadingOverlay;
