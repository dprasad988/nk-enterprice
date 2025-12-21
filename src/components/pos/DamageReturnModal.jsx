import React, { useState } from 'react';
import Modal from '../Modal';
import ConfirmModal from '../ConfirmModal';
import { CheckCircle, Printer, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { fetchSaleById } from '../../api/sales';
import { createReturnRequest, fetchReturnsBySale, issueReturnVoucher } from '../../api/returns';
import { printVoucher } from '../../templates/VoucherTemplate';

const DamageReturnModal = ({ isOpen, onClose, showAlert, initialBillId }) => {
    const [returnBillId, setReturnBillId] = useState('');
    const [returnSaleData, setReturnSaleData] = useState(null);
    const [existingRequests, setExistingRequests] = useState([]);

    // Selection for NEW requests
    const [returnSelection, setReturnSelection] = useState({});

    // Selection for ISSUING VOUCHERS (Approved items)
    const [issueSelection, setIssueSelection] = useState({});

    const [createdVoucher, setCreatedVoucher] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'REQUEST' or 'ISSUE'

    // Effect to auto-load bill if provided
    React.useEffect(() => {
        if (isOpen && initialBillId) {
            setReturnBillId(initialBillId);
            findBill(initialBillId);
        }
    }, [isOpen, initialBillId]);

    const findBill = async (id) => {
        if (!id) return;
        try {
            const sale = await fetchSaleById(id);
            if (sale) {
                // Check policy logic if needed
                setReturnSaleData(sale);
                loadRequests(sale.id);
                setReturnSelection({});
                setIssueSelection({});
                // setReturnBillId(id); // Already set if coming from input or prop
            } else {
                showAlert("Bill not found.");
            }
        } catch (e) {
            console.error(e);
            showAlert("Error fetching bill.");
        }
    };

    const handleFindBill = () => {
        findBill(returnBillId);
    };

    const loadRequests = async (saleId) => {
        try {
            const reqs = await fetchReturnsBySale(saleId);
            setExistingRequests(reqs);
        } catch (e) {
            console.error("Failed to load existing requests", e);
        }
    };

    const handleRequestAction = () => {
        setConfirmAction('REQUEST');
        setShowConfirm(true);
    };

    const handleIssueAction = () => {
        setConfirmAction('ISSUE');
        setShowConfirm(true);
    };

    const processRequest = async () => {
        const itemsToReturn = Object.entries(returnSelection).map(([pid, qty]) => ({
            saleId: returnSaleData.id,
            productId: pid,
            quantity: qty,
            reason: "Damaged"
        }));

        try {
            await createReturnRequest(itemsToReturn);
            showAlert("Return Requested Successfully! Waiting for Admin Approval.", "success");
            setReturnSelection({});
            loadRequests(returnSaleData.id); // Reload status
            setShowConfirm(false);
        } catch (e) {
            console.error(e);
            showAlert("Request Failed: " + (e.response?.data?.message || e.message), "error");
            setShowConfirm(false);
        }
    };

    const processIssueVoucher = async () => {
        // Collect ALL APPROVED items (Auto-Add logic)
        const idsToIssue = existingRequests
            .filter(req => req.status === 'APPROVED')
            .map(req => req.id);

        if (idsToIssue.length === 0) return;

        try {
            const voucher = await issueReturnVoucher(idsToIssue);
            setCreatedVoucher(voucher);
            showAlert("Voucher Issued Successfully!", "success");
            loadRequests(returnSaleData.id);
            setShowConfirm(false);
        } catch (e) {
            console.error(e);
            showAlert("Issue Failed: " + (e.response?.data?.message || e.message), "error");
            setShowConfirm(false);
        }
    };

    const resetState = () => {
        setReturnSaleData(null);
        setCreatedVoucher(null);
        setReturnBillId('');
        setReturnSelection({});
        setExistingRequests([]);
        setIssueSelection({});
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} title="Damage Return Processing">
                <div style={{ padding: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
                    {!returnSaleData ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Find Bill to Process</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        placeholder="Enter Bill ID..."
                                        value={returnBillId}
                                        onChange={(e) => setReturnBillId(e.target.value)}
                                        style={{ flex: 1, padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFindBill()}
                                    />
                                    <button className="btn btn-primary" onClick={handleFindBill}>Find</button>
                                </div>
                            </div>
                        </>
                    ) : createdVoucher ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: 'var(--success)', marginBottom: '1rem' }}><CheckCircle size={48} style={{ margin: '0 auto' }} /></div>
                            <h3>Voucher Issued!</h3>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '1rem', border: '2px dashed var(--accent-color)', margin: '1rem 0', cursor: 'pointer' }}
                                onClick={() => { navigator.clipboard.writeText(createdVoucher.code); showAlert("Code Copied!"); }}
                            >
                                {createdVoucher.code}
                            </div>
                            <p>Amount: Rs. {createdVoucher.amount}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn" onClick={() => printVoucher(createdVoucher)} style={{ flex: 1, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Printer size={18} /> Print Slip
                                </button>
                                <button className="btn btn-primary" onClick={handleClose} style={{ flex: 1 }}>Close</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Header Info */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <div><strong>Bill #{returnSaleData.id}</strong></div>
                                <div style={{ color: 'var(--text-secondary)' }}>{new Date(returnSaleData.saleDate).toLocaleDateString()}</div>
                            </div>

                            {/* Section 1: Existing Requests */}
                            {existingRequests.length > 0 && (
                                <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Return Status</h4>
                                    {existingRequests.map(req => (
                                        <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px dashed var(--border-color)' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold' }}>{req.productName} (x{req.quantity})</div>
                                                <div style={{ fontSize: '0.8rem', color: req.status === 'APPROVED' ? 'var(--success)' : req.status === 'REJECTED' ? 'var(--danger)' : 'var(--warning)' }}>
                                                    {req.status} {req.status === 'VOUCHER_ISSUED' && '(Paid)'}
                                                </div>
                                            </div>
                                            {req.status === 'APPROVED' && (
                                                <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                                    <CheckCircle size={18} />
                                                </div>
                                            )}
                                            {req.status === 'VOUCHER_ISSUED' && req.voucherCode && (
                                                <div style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{req.voucherCode}</div>
                                            )}
                                        </div>
                                    ))}
                                    {/* Issue Button: Shows if any item is APPROVED */}
                                    {existingRequests.some(req => req.status === 'APPROVED') && (
                                        <button className="btn" onClick={handleIssueAction} style={{ marginTop: '0.5rem', width: '100%', backgroundColor: 'var(--success)', color: 'white' }}>
                                            Issue Return Voucher for Approved Items
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Section 2: New Request */}
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Request New Return</h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {returnSaleData.items.map(item => {
                                        // Calculate remaining quantity allowed to return
                                        const alreadyRequested = existingRequests
                                            .filter(req => String(req.productId) === String(item.productId))
                                            .reduce((sum, req) => sum + req.quantity, 0);

                                        const remainingQty = item.quantity - alreadyRequested;

                                        if (remainingQty <= 0) return null; // Logic Fix: Don't allow requesting more if fully returned

                                        return (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <div style={{ flex: 1, marginRight: '1rem' }}>{item.productName}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {/* UI Fix: Group Max label and checkbox in one row with nowrap */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max: {remainingQty}</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!returnSelection[item.productId]}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setReturnSelection(prev => ({ ...prev, [item.productId]: remainingQty }));
                                                                else {
                                                                    const newSel = { ...returnSelection };
                                                                    delete newSel[item.productId];
                                                                    setReturnSelection(newSel);
                                                                }
                                                            }}
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                        />
                                                    </div>
                                                    {returnSelection[item.productId] && (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={remainingQty}
                                                            value={returnSelection[item.productId]}
                                                            onChange={(e) => setReturnSelection(prev => ({ ...prev, [item.productId]: Math.min(remainingQty, Math.max(1, parseInt(e.target.value) || 1)) }))}
                                                            style={{ width: '60px', padding: '0.3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button className="btn btn-secondary" onClick={handleClose}>Close</button>
                                <button
                                    className="btn btn-primary"
                                    disabled={Object.keys(returnSelection).length === 0}
                                    onClick={handleRequestAction}
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmAction === 'REQUEST' ? processRequest : processIssueVoucher}
                title={confirmAction === 'REQUEST' ? "Confirm Return Request" : "Issue Voucher"}
                message={confirmAction === 'REQUEST'
                    ? "Submit this damage return request for Admin approval? Items will be recorded as pending return."
                    : "Issue a voucher for the selected APPROVED items?"
                }
                confirmText={confirmAction === 'REQUEST' ? "Submit Request" : "Issue Voucher"}
                isDanger={false}
            />
        </>
    );
};

export default DamageReturnModal;
