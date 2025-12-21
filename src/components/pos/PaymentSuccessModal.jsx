import React from 'react';
import Modal from '../Modal';
import { CheckCircle } from 'lucide-react';

const PaymentSuccessModal = ({ isOpen, onClose, lastSaleTotal }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0', textAlign: 'center' }}>
                <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                    <CheckCircle size={64} />
                </div>
                <h2 style={{ marginBottom: '0.5rem' }}>Payment Successful!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Transaction completed successfully.
                </p>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
                    Rs. {lastSaleTotal.toFixed(2)}
                </div>
                <button className="btn btn-primary" onClick={onClose} style={{ width: '100%', padding: '1rem' }}>
                    Start New Sale
                </button>
            </div>
        </Modal>
    );
};

export default PaymentSuccessModal;
