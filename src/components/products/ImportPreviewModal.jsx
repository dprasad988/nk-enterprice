import React, { useState } from 'react';
import { X, Check, AlertTriangle, ArrowRight } from 'lucide-react';

const ImportPreviewModal = ({ isOpen, onClose, data, onConfirm, isProcessing }) => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'updates'

    if (!isOpen) return null;

    const { newItems = [], updates = [] } = data;

    const TabButton = ({ id, label, count, color }) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                flex: 1,
                padding: '1rem',
                background: activeTab === id ? 'var(--bg-secondary)' : 'transparent',
                borderBottom: activeTab === id ? `2px solid ${color}` : '2px solid transparent',
                fontWeight: activeTab === id ? 'bold' : 'normal',
                color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {label}
            <span style={{
                background: color,
                color: 'white',
                padding: '0.1rem 0.5rem',
                borderRadius: '1rem',
                fontSize: '0.75rem'
            }}>
                {count}
            </span>
        </button>
    );

    // Helper to render value change
    const ChangeCell = ({ oldVal, newVal, type = 'text' }) => {
        const isChanged = oldVal !== newVal;
        if (!isChanged) return <span style={{ color: 'var(--text-secondary)' }}>{oldVal}</span>;

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', opacity: 0.7 }}>
                    {oldVal}
                </span>
                <ArrowRight size={14} color="var(--accent-color)" />
                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                    {newVal}
                </span>
            </div>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
            backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                width: '900px',
                height: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                border: '2px solid #FBC02D', // Yellow Import Border
            }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Import Preview</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Review changes before applying to database
                        </p>
                    </div>
                    {!isProcessing && (
                        <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}>
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <TabButton id="new" label="New Items" count={newItems.length} color="var(--success)" />
                    <TabButton id="updates" label="Updates" count={updates.length} color="#3b82f6" />
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', background: 'var(--bg-tertiary)' }}>
                    {activeTab === 'new' && (
                        <div>
                            {newItems.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                                    No new items to add.
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '0.75rem' }}>Barcode</th>
                                            <th style={{ padding: '0.75rem' }}>Name</th>
                                            <th style={{ padding: '0.75rem' }}>Price</th>
                                            <th style={{ padding: '0.75rem' }}>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newItems.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{item.barcode}</td>
                                                <td style={{ padding: '0.75rem' }}>{item.name}</td>
                                                <td style={{ padding: '0.75rem' }}>Rs. {item.price.toFixed(2)}</td>
                                                <td style={{ padding: '0.75rem' }}>{item.stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'updates' && (
                        <div>
                            {updates.length === 0 ? (
                                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                                    No existing items to update.
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                                            <th style={{ padding: '0.75rem' }}>Barcode</th>
                                            <th style={{ padding: '0.75rem', width: '30%' }}>Name Change</th>
                                            <th style={{ padding: '0.75rem' }}>Price Change</th>
                                            <th style={{ padding: '0.75rem' }}>Stock Change</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {updates.map((item, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                                                <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                                                    {item.new.barcode}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <ChangeCell oldVal={item.original.name} newVal={item.new.name} />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <ChangeCell oldVal={item.original.price} newVal={item.new.price} />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <ChangeCell oldVal={item.original.stock} newVal={item.new.stock} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        className="btn"
                        onClick={onClose}
                        disabled={isProcessing}
                        style={{ border: '1px solid var(--border-color)' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={isProcessing || (newItems.length === 0 && updates.length === 0)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {isProcessing ? 'Processing... ' : <Check size={18} />}
                        {isProcessing ? 'Please Wait' : 'Confirm Import'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportPreviewModal;
