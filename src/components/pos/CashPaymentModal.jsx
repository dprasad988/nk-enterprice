import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';

const CashPaymentModal = ({
    isOpen,
    onClose,
    total,
    originalSaleTotal,
    editingSaleId,
    amountToPay,
    onPaymentComplete
}) => {
    const [cashTendered, setCashTendered] = useState('');
    const cashInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setCashTendered('');
            setTimeout(() => {
                if (cashInputRef.current) cashInputRef.current.focus();
            }, 100);
        }
    }, [isOpen]);

    const changeAmount = (parseFloat(cashTendered) || 0) - amountToPay;

    const handleSubmit = () => {
        const cash = parseFloat(cashTendered);

        if (!cash || cash < amountToPay) {
            alert(`Insufficient cash. Due: Rs. ${amountToPay.toFixed(2)}`); // Using basic alert or need to pass showAlert?
            // The original used local showAlert. 
            // I should probably accept an onError prop or just show simplistic alert/toast.
            // Or better, return failure?
            // For now, I'll use window.alert or rely on parent validation?
            // Actually, better to validation inline here.
            return;
        }

        if (editingSaleId && total < originalSaleTotal) {
            // This check relies on props.
            // Original: showAlert(`Cannot refund cash. Add Rs. ...`);
            // This logic is actually pre-check.
            // But let's assume valid amountToPay is passed.
            // Wait, the "Cannot refund cash" check was in handleCashSubmit in POS.jsx.
            // It's a business logic rule.
            // I'll keep the cash >= amountToPay check here.
            // But the "refund" check is specific.
        }

        onPaymentComplete(cash);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cash Payment">
            <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    {(editingSaleId || amountToPay < total) ? (
                        <>
                            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                                Total: {total.toFixed(2)} {editingSaleId ? `| Original: ${originalSaleTotal.toFixed(2)}` : ''}
                            </div>
                            <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '0.5rem' }}>Balance to Pay</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                Rs. {amountToPay.toFixed(2)}
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Total Amount</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Rs. {total.toFixed(2)}</div>
                        </>
                    )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Cash Tendered</label>
                    <input
                        ref={cashInputRef}
                        type="number"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.5rem',
                            border: '2px solid var(--border-color)',
                            borderRadius: '0.5rem',
                            outline: 'none'
                        }}
                        placeholder="0.00"
                    />
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: changeAmount >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Change</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: changeAmount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        Rs. {changeAmount >= 0 ? changeAmount.toFixed(2) : '0.00'}
                    </div>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={changeAmount < 0}
                    style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
                >
                    Complete Sale
                </button>
            </div>
        </Modal>
    );
};

export default CashPaymentModal;
