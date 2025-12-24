import React from 'react';
import Modal from '../Modal';

const DeleteProductModal = ({ isOpen, onClose, onConfirm, productName }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Delete"
        >
            <div style={{ padding: '1rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                    Are you sure you want to delete <strong>{productName}</strong>?
                    <br />
                    This action cannot be undone.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button
                        className="btn"
                        onClick={onClose}
                        style={{ backgroundColor: 'var(--bg-tertiary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-danger"
                        onClick={onConfirm}
                    >
                        Delete Product
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteProductModal;
