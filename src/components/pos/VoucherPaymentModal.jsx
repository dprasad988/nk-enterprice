import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { verifyVoucher } from '../../api/vouchers';

const VoucherPaymentModal = ({
    isOpen,
    onClose,
    total,
    onFullPayment, // (paymentMethodString) => void
    onPartialPayment // (voucherCode, voucherAmount) => void
}) => {
    const [voucherCode, setVoucherCode] = useState('');
    const [verifiedVoucher, setVerifiedVoucher] = useState(null);
    const [error, setError] = useState(null);

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
                    <div>Total Due: Rs. {total.toFixed(2)}</div>
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
                        <div style={{ margin: '1rem 0' }}>Balance: Rs. {verifiedVoucher.currentBalance.toFixed(2)}</div>

                        {verifiedVoucher.currentBalance >= total ? (
                            <button className="btn btn-primary" onClick={() => {
                                onFullPayment('VOUCHER_CODE:' + verifiedVoucher.code);
                                onClose();
                            }} style={{ width: '100%', padding: '1rem' }}>
                                PAY FULL AMOUNT (Rs. {total.toFixed(2)})
                            </button>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: 'var(--warning-text)', marginBottom: '1rem' }}>
                                    Insufficient Balance to cover full amount.
                                </div>
                                <button className="btn" onClick={() => {
                                    onPartialPayment(verifiedVoucher.code, verifiedVoucher.currentBalance);
                                    onClose();
                                }} style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--warning)' }}>
                                    Use Rs. {verifiedVoucher.currentBalance.toFixed(2)} & Pay Balance
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default VoucherPaymentModal;
