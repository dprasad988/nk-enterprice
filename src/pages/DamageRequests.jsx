import React, { useState } from 'react';
import { usePendingReturns, useAllReturns, approveReturn, rejectReturn } from '../api/returns';
import { Check, X, AlertTriangle, FileText, List } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { useStore } from '../context/StoreContext';
import { useAlert } from '../context/AlertContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const DamageRequests = () => {
    const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'history'
    const [actionRequest, setActionRequest] = useState(null); // { id, type: 'APPROVE' | 'REJECT' }
    const { selectedStoreId, role } = useStore();
    const { showAlert } = useAlert();
    const queryStoreId = role === 'OWNER' ? selectedStoreId : localStorage.getItem('storeId');

    // TanStack Query Hooks
    const { data: requests = [], isLoading: requestsLoading } = usePendingReturns(queryStoreId);
    const { data: historyData = [], isLoading: historyLoading } = useAllReturns(queryStoreId);

    // Sort history
    const history = historyData ? [...historyData].sort((a, b) => new Date(b.returnDate) - new Date(a.returnDate)) : [];

    const loading = activeTab === 'requests' ? requestsLoading : historyLoading;

    // Mutations
    const queryClient = useQueryClient();

    const actionMutation = useMutation({
        mutationFn: async ({ id, type }) => {
            if (type === 'APPROVE') return approveReturn(id);
            else return rejectReturn(id);
        },
        onSuccess: (data, variables) => {
            const type = variables.type;
            showAlert(`Request ${type === 'APPROVE' ? 'Approved' : 'Rejected'}`, type === 'APPROVE' ? 'success' : 'info');
            queryClient.invalidateQueries(['pendingReturns']);
            queryClient.invalidateQueries(['allReturns']);
            queryClient.invalidateQueries(['approvedReturns']);
            setActionRequest(null);
        },
        onError: (error) => {
            showAlert("Action failed: " + (error.response?.data?.message || error.message), "error");
            setActionRequest(null);
        }
    });

    const handleAction = () => {
        if (!actionRequest) return;
        actionMutation.mutate(actionRequest);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'APPROVED': return { color: 'var(--success)', fontWeight: 'bold' };
            case 'REJECTED': return { color: 'var(--danger)', fontWeight: 'bold' };
            case 'VOUCHER_ISSUED': return { color: 'var(--accent-color)', fontWeight: 'bold' };
            default: return { color: 'var(--warning-text)', fontWeight: 'bold' };
        }
    };

    return (
        <div className="fade-in">

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div
                    className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'requests' ? '2px solid var(--accent-color)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <FileText size={18} /> Requests
                    {requests.length > 0 && <span style={{ backgroundColor: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>{requests.length}</span>}
                </div>
                <div
                    className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: activeTab === 'history' ? '2px solid var(--accent-color)' : 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <List size={18} /> Damaged Products
                </div>
            </div>

            <div className="card">
                {loading ? (
                    <p style={{ padding: '2rem', textAlign: 'center' }}>Loading...</p>
                ) : activeTab === 'requests' ? (
                    // Request Tab Content
                    requests.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No pending requests.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Product</th>
                                    <th>Reason</th>
                                    <th>Bill ID</th>
                                    <th>Cashier</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td>{new Date(req.returnDate).toLocaleDateString()} <br /><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(req.returnDate).toLocaleTimeString()}</span></td>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{req.productName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Qty: {req.quantity}</div>
                                        </td>
                                        <td>{req.reason}</td>
                                        <td>#{req.originalSaleId}</td>
                                        <td>{req.returnedBy}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn"
                                                    onClick={() => setActionRequest({ id: req.id, type: 'APPROVE' })}
                                                    style={{ backgroundColor: 'var(--success)', color: 'white', padding: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                    title="Approve"
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    className="btn"
                                                    onClick={() => setActionRequest({ id: req.id, type: 'REJECT' })}
                                                    style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                                    title="Reject"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                ) : (
                    // History Tab Content
                    history.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No damage history found.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Bill ID</th>
                                    <th>Product</th>
                                    <th>Returned By</th>
                                    <th>Status</th>
                                    <th>Voucher</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.returnDate).toLocaleDateString()}</td>
                                        <td>#{item.originalSaleId}</td>
                                        <td>
                                            <div>{item.productName}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Qty: {item.quantity}</div>
                                        </td>
                                        <td>{item.returnedBy}</td>
                                        <td>
                                            <span style={getStatusStyle(item.status)}>{item.status}</span>
                                            {item.approvedBy && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    by {item.approvedBy}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {item.voucherCode ? (
                                                <div style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: '4px', display: 'inline-block' }}>
                                                    {item.voucherCode}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            <ConfirmModal
                isOpen={!!actionRequest}
                onClose={() => setActionRequest(null)}
                onConfirm={handleAction}
                title={actionRequest?.type === 'APPROVE' ? "Approve Return" : "Reject Return"}
                message={`Are you sure you want to ${actionRequest?.type.toLowerCase()} this return request?`}
                confirmText={actionRequest?.type === 'APPROVE' ? "Approve" : "Reject"}
                isDanger={actionRequest?.type === 'REJECT'}
            />
        </div>
    );
};

export default DamageRequests;
