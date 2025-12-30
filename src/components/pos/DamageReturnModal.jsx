import React, { useState } from 'react';
import Modal from '../Modal';
import ConfirmModal from '../ConfirmModal';
import { CheckCircle, Printer, RefreshCw, AlertCircle, Clock, Copy } from 'lucide-react';
import { fetchSaleById } from '../../api/sales';
import { createReturnRequest, fetchReturnsBySale, issueReturnVoucher } from '../../api/returns';
import { printVoucher } from '../../templates/VoucherTemplate';

const DamageReturnModal = ({ isOpen, onClose, showAlert, initialBillId, onVoucherIssued }) => {
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
    const [localError, setLocalError] = useState(null);

    // Effect to auto-load bill if provided
    React.useEffect(() => {
        if (isOpen && initialBillId) {
            setReturnBillId(initialBillId);
            findBill(initialBillId);
        }
    }, [isOpen, initialBillId]);

    const findBill = async (id) => {
        if (!id) return;
        setLocalError(null);
        try {
            const sale = await fetchSaleById(id);
            if (sale) {
                // Check policy logic if needed
                // Frontend 3-Day Expiry Check
                const saleDate = new Date(sale.saleDate);
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                if (saleDate < threeDaysAgo) {
                    const msg = `Return period expired (Limit: 3 Days). Sale Date: ${saleDate.toLocaleDateString()}`;
                    setLocalError(msg);
                    showAlert(msg, "error");
                    return;
                }

                setReturnSaleData(sale);
                loadRequests(sale.id);
                setReturnSelection({});
                setIssueSelection({});
                // setReturnBillId(id); // Already set if coming from input or prop
            } else {
                setLocalError("Bill not found.");
                showAlert("Bill not found.");
            }
        } catch (e) {
            console.error(e);
            setLocalError("Error fetching bill.");
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
        const itemsToReturn = Object.entries(returnSelection)
            .map(([pid, qty]) => {
                const quantity = parseInt(qty) || 0;
                return {
                    saleId: returnSaleData.id,
                    productId: pid,
                    quantity: quantity,
                    reason: "Damaged"
                };
            })
            .filter(item => item.quantity > 0);

        if (itemsToReturn.length === 0) {
            showAlert("Please select at least one item to return.", "warning");
            return;
        }

        try {
            await createReturnRequest(itemsToReturn);
            showAlert("Return Requested Successfully! Waiting for Admin Approval.", "success");
            setReturnSelection({});
            loadRequests(returnSaleData.id); // Reload status
            setShowConfirm(false);
        } catch (e) {
            console.error(e);
            const data = e.response?.data;
            const msg = (typeof data === 'string' ? data : data?.message) || e.message;
            showAlert("Request Failed: " + msg, "error");
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
            if (onVoucherIssued) onVoucherIssued(voucher);
            showAlert("Voucher Issued Successfully!", "success");
            loadRequests(returnSaleData.id);
            setShowConfirm(false);
        } catch (e) {
            console.error(e);
            showAlert("Issue Failed: " + (e.response?.data?.message || e.message), "error");
            setShowConfirm(false);
        }
    };

    const [hasCopiedOrPrinted, setHasCopiedOrPrinted] = useState(false);

    // Reset state helper
    const resetState = () => {
        setReturnSaleData(null);
        setCreatedVoucher(null);
        setReturnBillId('');
        setReturnSelection({});
        setExistingRequests([]);
        setIssueSelection({});
        setHasCopiedOrPrinted(false);
    };

    const handleClose = () => {
        // Safe Close Check
        if (createdVoucher && !hasCopiedOrPrinted) {
            showAlert("Please Copy or Print the voucher before closing!", "warning");
            return;
        }
        resetState();
        onClose();
    };

    const handleCopy = () => {
        if (createdVoucher) {
            navigator.clipboard.writeText(createdVoucher.code);
            showAlert("Voucher Code Copied!", "success");
            setHasCopiedOrPrinted(true);
        }
    };

    const handlePrint = () => {
        if (createdVoucher) {
            printVoucher(createdVoucher);
            setHasCopiedOrPrinted(true);
            // We can now safely close, optionally wait a moment or let user close
            // User requested: "make sure rescrict close... before copy... or print".
            // If printed, it's safe. We can auto-close if desired, or let them close.
            // Previous logic was auto-close. I'll invoke handleClose() which now passes because state is true.
            setTimeout(() => {
                resetState();
                onClose();
            }, 500);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} title="Damage Return Processing">
                <div style={{ padding: '1rem', maxHeight: '80vh', overflowY: 'auto' }}>
                    {!returnSaleData ? (
                        <>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Find Bill to Process</label>
                                {localError && (
                                    <div style={{ color: 'var(--danger)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                                        {localError}
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        autoFocus
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
                            {/* Icon Removed as per request */}
                            <h3 style={{ marginTop: '1rem' }}>Voucher Issued!</h3>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '1rem', border: '2px dashed var(--accent-color)', cursor: 'default', flex: 1, textAlign: 'center' }}>
                                    {createdVoucher.code}
                                </div>
                                <button
                                    className="btn"
                                    onClick={handleCopy}
                                    title="Copy Code"
                                    style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                >
                                    <CheckCircle size={20} style={{ display: hasCopiedOrPrinted ? 'block' : 'none', color: 'var(--success)' }} />
                                    {!hasCopiedOrPrinted && <Printer size={0} style={{ display: 'none' }} /> /* Hack to import something if needed, but using Copy icon would be better if imported. Use text if no icon available. */}
                                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>COPY</span>
                                </button>
                            </div>

                            <p>Amount: Rs. {createdVoucher.amount}</p>
                            <div style={{ marginTop: '1.5rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={handlePrint}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem' }}
                                >
                                    <Printer size={18} /> Print Slip
                                </button>
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
                                                            checked={returnSelection[item.productId] !== undefined}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setReturnSelection(prev => ({ ...prev, [item.productId]: remainingQty > 0 ? 1 : 0 }));
                                                                else {
                                                                    const newSel = { ...returnSelection };
                                                                    delete newSel[item.productId];
                                                                    setReturnSelection(newSel);
                                                                }
                                                            }}
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                        />
                                                    </div>
                                                    {returnSelection[item.productId] !== undefined && (
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={remainingQty}
                                                            value={returnSelection[item.productId]}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (val === '') {
                                                                    setReturnSelection(prev => ({ ...prev, [item.productId]: "" }));
                                                                } else {
                                                                    const parsed = parseInt(val);
                                                                    if (!isNaN(parsed)) {
                                                                        setReturnSelection(prev => ({ ...prev, [item.productId]: Math.min(remainingQty, parsed) }));
                                                                    }
                                                                }
                                                            }}
                                                            style={{ width: '60px', padding: '0.3rem', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', zIndex: 100, pointerEvents: 'auto', userSelect: 'text', opacity: 1, backgroundColor: 'var(--bg-tertiary)', color: 'white' }}
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
