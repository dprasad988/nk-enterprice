import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { verifyVoucher } from '../../api/vouchers';

const VoucherPaymentModal = ({
    isOpen,
    onClose,
    total,
    amountDue,
    onApplyVoucher // (voucher) => void
}) => {
    const [voucherCode, setVoucherCode] = useState('');
    const [verifiedVoucher, setVerifiedVoucher] = useState(null);
    const [error, setError] = useState(null);

    // Use amountDue if provided, otherwise default to total
    const effectiveTotal = amountDue !== undefined ? amountDue : total;

    useEffect(() => {
        if (isOpen) {
            setVoucherCode('');
            setVerifiedVoucher(null);
            setError(null);
        }
    }, [isOpen]);

    const handleVerify = async () => {
        setError(null);
        try {
            const v = await verifyVoucher(voucherCode.trim());
            setVerifiedVoucher(v);
        } catch (e) {
            setError(e.response?.data?.message || e.message);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Pay with Voucher">
            <div style={{ padding: '1rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div>Total Due: Rs. {effectiveTotal.toFixed(2)}</div>
                    {amountDue !== undefined && amountDue < total && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            (Cart Total: Rs. {total.toFixed(2)})
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                {!verifiedVoucher ? (
                    <>
                        <input
                            type="text"
                            placeholder="Enter Voucher Code (e.g. V-123...)"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', marginBottom: '1rem', border: '1px solid var(--border-color)' }}
                        />
                        <button className="btn btn-primary" onClick={handleVerify} style={{ width: '100%', padding: '1rem' }}>Verify Code</button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }}>Voucher Verified</div>
                        <div style={{ margin: '1rem 0' }}>Available Balance: Rs. {verifiedVoucher.currentBalance.toFixed(2)}</div>

                        {verifiedVoucher.currentBalance < effectiveTotal && (
                            <div style={{ color: 'var(--warning-text)', marginBottom: '1rem' }}>
                                Insufficient Balance to cover full amount.
                            </div>
                        )}

                        <button className="btn btn-primary" onClick={() => {
                            onApplyVoucher(verifiedVoucher);
                            onClose();
                        }} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                            APPLY VOUCHER (Rs. {verifiedVoucher.currentBalance.toFixed(2)})
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default VoucherPaymentModal;
