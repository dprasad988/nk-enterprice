import React, { useState } from 'react';
import Modal from '../Modal';
import { fetchExchangeableSaleById } from '../../api/sales'; // Adjust path

const RetrieveBillModal = ({ isOpen, onClose, onRetrieve }) => {
    const [retrieveId, setRetrieveId] = useState('');
    const [error, setError] = useState(null);

    const handleRetrieve = async () => {
        if (!retrieveId) return;
        setError(null);
        try {
            const sale = await fetchExchangeableSaleById(retrieveId);
            if (!sale) {
                setError("Bill not found.");
                return;
            }
            onRetrieve(sale);
            onClose();
            setRetrieveId('');
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.message || e.message || "Error fetching bill.";
            setError(msg);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Retrieve Bill">
            <div style={{ padding: '1rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Enter the Receipt Number (ID) to load items for exchange/correction.</p>

                {error && (
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <input
                    type="text"
                    placeholder="Bill Number... (e.g. 15)"
                    value={retrieveId}
                    onChange={(e) => setRetrieveId(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1.2rem', marginBottom: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                />
                <button className="btn btn-primary" onClick={handleRetrieve} style={{ width: '100%', padding: '1rem' }}>
                    Retrieve & Edit
                </button>
            </div>
        </Modal>
    );
};

export default RetrieveBillModal;
