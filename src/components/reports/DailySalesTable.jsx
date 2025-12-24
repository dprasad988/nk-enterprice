import React, { useState } from 'react';
import { useDailySalesReport } from '../../api/reports';
import { ChevronDown, ChevronRight, AlertCircle, Ticket, CheckCircle, XCircle, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const DailySalesTable = () => {
    const { selectedStoreId, role } = useStore();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: report, isLoading, error } = useDailySalesReport(selectedDate, role === 'OWNER' ? selectedStoreId : null);

    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (saleId) => {
        setExpandedRows(prev => ({
            ...prev,
            [saleId]: !prev[saleId]
        }));
    };

    if (isLoading) return <div className="p-4 text-center">Loading Daily Report...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading report</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header / Date Selection */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                <Calendar size={20} style={{ color: 'var(--accent-color)' }} />
                <label style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>Report Date:</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
            </div>

            {/* Summary Cards */}
            {report && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--accent-color)' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-color)' }}>
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Sales</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                Rs. {report.totalSales?.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--success)' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Profit</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                Rs. {report.totalProfit?.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #8b5cf6' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                            <Ticket size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Transactions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {report.totalBills}
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--danger)' }}>
                        <div style={{ padding: '0.75rem', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Returned Bills</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                                {report.totalReturns}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Transaction Details</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', width: '40px' }}></th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Bill No</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Time</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Cashier</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)' }}>Payment</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Total</th>
                                <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--text-secondary)' }}>Profit</th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report?.bills?.map(bill => (
                                <React.Fragment key={bill.saleId}>
                                    <tr
                                        onClick={() => toggleRow(bill.saleId)}
                                        style={{
                                            borderBottom: '1px solid var(--border-color)',
                                            cursor: 'pointer',
                                            backgroundColor: expandedRows[bill.saleId] ? 'var(--bg-tertiary)' : 'transparent',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedRows[bill.saleId] ? 'var(--bg-tertiary)' : 'transparent'}
                                    >
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {expandedRows[bill.saleId] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>#{bill.billNo}</td>
                                        <td style={{ padding: '1rem' }}>{bill.time}</td>
                                        <td style={{ padding: '1rem' }}>{bill.cashier}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span>{bill.paymentMethod}</span>
                                                {bill.isVoucherUsed && (
                                                    <span style={{ fontSize: '0.75rem', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Ticket size={12} /> Voucher Used
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>Rs. {bill.totalAmount.toFixed(2)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: 'var(--success)', fontWeight: 'bold' }}>Rs. {bill.profit.toFixed(2)}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                {bill.hasReturns && (
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertCircle size={10} /> Ret
                                                    </span>
                                                )}
                                                {bill.isExchange && (
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                                        Exch
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedRows[bill.saleId] && (
                                        <tr>
                                            <td colSpan="8" style={{ padding: 0 }}>
                                                <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                                    <table style={{ width: '100%', fontSize: '0.9rem' }}>
                                                        <thead>
                                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)' }}>Item</th>
                                                                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-secondary)' }}>Qty</th>
                                                                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-secondary)' }}>Price</th>
                                                                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-secondary)' }}>Cost</th>
                                                                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-secondary)' }}>Profit</th>
                                                                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-secondary)' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {bill.items.map((item, idx) => (
                                                                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                                    <td style={{ padding: '0.5rem' }}>{item.productName}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.cost.toFixed(2)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--success)' }}>{item.profit.toFixed(2)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                        {item.isReturned && (
                                                                            <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold' }}>RETURNED</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>

                                                    {(bill.voucherCode || bill.hasReturns) && (
                                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>RETURN & VOUCHER DETAILS</div>
                                                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                                                                {bill.voucherCode ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <Ticket size={16} color="#8b5cf6" />
                                                                        <span>Voucher Issued: <strong style={{ color: 'var(--text-primary)' }}>{bill.voucherCode}</strong></span>
                                                                        <span style={{
                                                                            padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                                                            backgroundColor: bill.voucherStatus === 'REDEEMED' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                                            color: bill.voucherStatus === 'REDEEMED' ? 'var(--success)' : '#3b82f6'
                                                                        }}>
                                                                            {bill.voucherStatus}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    bill.hasReturns && <span style={{ color: 'var(--text-secondary)' }}>Return Pending (No Voucher Issued Yet)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {!report?.bills?.length && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No sales found for this date.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailySalesTable;
