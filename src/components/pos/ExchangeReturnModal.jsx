import React, { useState } from 'react';
import Modal from '../Modal';
import { AlertTriangle } from 'lucide-react';
import { processExchangeReturn } from '../../api/returns';

const ExchangeReturnModal = ({ isOpen, onClose, saleData, onVoucherIssued, showAlert }) => {
    const [selection, setSelection] = useState({});
    const [loading, setLoading] = useState(false);

    // Filter items that are returnable (not fully returned already) - Assuming saleData.items reflects current state or we fetch fresh?
    // Note: If backend doesn't update Sale items with return qty, we might need to rely on what "quantity" implies.
    // For now, allow selecting up to purchased quantity.

    const toggleItem = (productId, maxQty) => {
        setSelection(prev => {
            if (prev[productId]) {
                const copy = { ...prev };
                delete copy[productId];
                return copy;
            } else {
                return { ...prev, [productId]: 1 };
            }
        });
    };

    const updateQty = (productId, val, maxQty) => {
        const qty = parseInt(val);
        if (isNaN(qty) || qty < 1) return;
        setSelection(prev => ({
            ...prev,
            [productId]: Math.min(qty, maxQty)
        }));
    };

    const handleProcess = async () => {
        const itemsToReturn = Object.entries(selection).map(([pid, qty]) => {
            return {
                saleId: saleData.id,
                productId: parseInt(pid), // Ensure ID is a number for backend
                quantity: qty,
                reason: "Customer Exchange"
            };
        });

        if (itemsToReturn.length === 0) {
            showAlert("Select items to return", "warning");
            return;
        }

        // Calculate Total Value locally (Client-Side)
        let totalValue = 0;
        itemsToReturn.forEach(item => {
            const originalItem = saleData.items.find(i => i.productId === item.productId);
            if (originalItem) {
                let price = originalItem.price;
                // Deduct discount if applied on line item
                if (originalItem.discount && originalItem.discount > 0) {
                    price = price * (1 - originalItem.discount / 100.0);
                }
                totalValue += price * item.quantity;
            }
        });

        setLoading(true);
        try {
            // Virtual Credit Object (No persisted voucher yet, just data)
            const virtualCredit = {
                code: "EXCHANGE",
                amount: totalValue,
                currentBalance: totalValue,
                isExchange: true,
                returnItems: itemsToReturn // Pass RAW ITEMS for backend to process later
            };

            showAlert("Exchange Prepared. Credit Applied to Cart.", "success");
            if (onVoucherIssued) onVoucherIssued(virtualCredit);
            onClose();
        } catch (e) {
            console.error(e);
            showAlert("Exchange preparation failed.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelection({});
        onClose();
    };

    if (!saleData) return null;

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Select Items for Exchange">
            <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bill #{saleData.id}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{new Date(saleData.saleDate).toLocaleDateString()}</span>
                </div>

                <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: '1rem' }}>
                    {saleData.items.map(item => (
                        <div key={item.productId} style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            borderBottom: '1px solid var(--border-color)',
                            opacity: selection[item.productId] ? 1 : 0.7
                        }}>
                            <input
                                type="checkbox"
                                checked={!!selection[item.productId]}
                                onChange={() => toggleItem(item.productId, item.quantity)}
                                style={{ width: '20px', height: '20px', marginRight: '1rem', cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Rs. {item.price} (Qty: {item.quantity})
                                </div>
                            </div>
                            {selection[item.productId] && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem' }}>Return:</span>
                                    <input
                                        type="number"
                                        value={selection[item.productId]}
                                        min={1}
                                        max={item.quantity}
                                        onChange={(e) => updateQty(item.productId, e.target.value, item.quantity)}
                                        style={{ width: '60px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: 'center' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ backgroundColor: 'var(--warning-light)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'start' }}>
                    <AlertTriangle size={18} style={{ color: 'var(--warning)', marginTop: '2px' }} />
                    <div style={{ fontSize: '0.85rem', color: 'var(--warning-dark)' }}>
                        Items will be <b>Returned to Stock</b> (Resellable). <br />
                        <b>Do NOT select Damaged items here.</b> Use the "Return" button for damages.
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleProcess}
                        disabled={loading || Object.keys(selection).length === 0}
                    >
                        {loading ? 'Processing...' : 'Process Exchange'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ExchangeReturnModal;
