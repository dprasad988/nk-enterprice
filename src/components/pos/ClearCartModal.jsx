import React from 'react';
import Modal from '../Modal';
import { Trash2 } from 'lucide-react';

const ClearCartModal = ({ isOpen, onClose, onConfirm, itemCount }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}><Trash2 /> Clear Cart</div>}
        >
            <div style={{ padding: '1rem' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                    Are you sure you want to remove all <strong>{itemCount}</strong> items from the cart?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button
                        className="btn"
                        onClick={onClose}
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn"
                        onClick={onConfirm}
                        style={{ padding: '0.5rem 1.5rem', backgroundColor: 'var(--danger)', color: 'white' }}
                    >
                        Yes, Clear Everything
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ClearCartModal;
