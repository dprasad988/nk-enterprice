import React from 'react';
import Modal from '../Modal';
import { PlayCircle, XCircle } from 'lucide-react';

const HeldSalesModal = ({ isOpen, onClose, heldSales, onResume, onDiscard }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Held / Parked Sales">
            <div style={{ padding: '1rem' }}>
                {heldSales.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No held sales.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {heldSales.map(sale => (
                            <div key={sale.id} style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>Sales ID: #{String(sale.id).slice(-6)}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sale.date}</div>
                                    <div style={{ marginTop: '0.5rem' }}>{sale.items.length} Items - <strong>Rs. {sale.total.toFixed(2)}</strong></div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn" onClick={() => onResume(sale)} style={{ backgroundColor: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <PlayCircle size={16} /> Resume
                                    </button>
                                    <button className="btn" onClick={() => onDiscard(sale.id)} style={{ color: 'var(--danger)', padding: '0.5rem' }}>
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default HeldSalesModal;
