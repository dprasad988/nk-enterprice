import React, { useState } from 'react';
import { useDailySalesReport } from '../../api/reports';
import { ChevronDown, ChevronRight, AlertCircle, Ticket, CheckCircle, XCircle, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const DailySalesTable = () => {
    const { selectedStoreId, role } = useStore();
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });

    // Pagination & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, NEW, EXCHANGE, RETURN
    const [currentPage, setCurrentPage] = useState(0); // 0-indexed for Spring Boot
    const itemsPerPage = 5;

    const { data: report, isLoading, error } = useDailySalesReport(
        selectedDate,
        role === 'OWNER' ? selectedStoreId : null,
        currentPage,
        itemsPerPage,
        searchTerm,
        statusFilter
    );

    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (saleId) => {
        setExpandedRows(prev => ({
            ...prev,
            [saleId]: !prev[saleId]
        }));
    };

    if (isLoading && !report) return <div className="p-4 text-center">Loading Daily Report...</div>;
    if (error) return <div className="p-4 text-center text-red-500">Error loading report</div>;

    const bills = report?.bills || [];
    const totalPages = report?.totalPages || 0;

    // Spring Boot uses 0-indexed pages, UI typically shows 1-indexed.
    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header / Date Selection / Filters */}
            <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Calendar size={20} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                    <label style={{ fontWeight: 'bold', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Report Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            borderRadius: '0.5rem',
                            width: '160px'
                        }}
                    />
                </div>
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
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Transaction Details</h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                            {report?.totalElements || 0} Total
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Search Cashier or Bill No..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}
                            style={{
                                padding: '0.4rem 0.8rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                borderRadius: '0.4rem',
                                width: '220px',
                                fontSize: '0.9rem'
                            }}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                            style={{
                                padding: '0.4rem 0.8rem',
                                background: 'var(--bg-primary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)',
                                borderRadius: '0.4rem',
                                width: '150px',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value="ALL">All Status</option>
                            <option value="NEW">New</option>
                            <option value="EXCHANGE">Exchange</option>
                            <option value="RETURN">Return</option>
                        </select>
                    </div>
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
                            {bills.map(bill => (
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
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {!bill.hasReturns && !bill.isExchange && (
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <CheckCircle size={10} /> New
                                                    </span>
                                                )}

                                                {bill.isExchange && (
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <TrendingUp size={10} /> Exch
                                                    </span>
                                                )}

                                                {bill.hasReturns && (
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.2rem 0.6rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <AlertCircle size={10} /> Ret
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
                                                                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-secondary)' }}>Barcode</th>
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
                                                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.barcode || '-'}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.quantity}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{item.cost.toFixed(2)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--success)' }}>{item.profit.toFixed(2)}</td>
                                                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                                                        {item.isReturned ? (
                                                                            <span style={{ color: 'var(--danger)', fontSize: '0.75rem', fontWeight: 'bold' }}>RETURNED ({item.quantity})</span>
                                                                        ) : item.isNew ? (
                                                                            <span style={{
                                                                                marginLeft: '0.5rem',
                                                                                fontSize: '0.7rem',
                                                                                backgroundColor: 'var(--success)',
                                                                                color: 'white',
                                                                                padding: '0.1rem 0.3rem',
                                                                                borderRadius: '4px'
                                                                            }}>
                                                                                NEW {item.addedQuantity > 0 && `(+${item.addedQuantity})`}
                                                                            </span>
                                                                        ) : null}
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


                                                    <SaleVersionsDisplay saleId={bill.saleId} />

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}

                        </tbody>
                    </table>
                    {!bills.length && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No sales found.
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="btn"
                        style={{
                            padding: '0.5rem 1rem',
                            opacity: currentPage === 0 ? 0.5 : 1,
                            cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        Previous
                    </button>
                    <span style={{ color: 'var(--text-secondary)' }}>
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1} // 0-indexed: max index is totalPages - 1
                        className="btn"
                        style={{
                            padding: '0.5rem 1rem',
                            opacity: currentPage === totalPages - 1 ? 0.5 : 1,
                            cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

const SaleVersionsDisplay = ({ saleId }) => {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const load = async () => {
            try {
                const { fetchSaleVersions } = await import('../../api/sales');
                const data = await fetchSaleVersions(saleId);
                setVersions(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [saleId]);

    if (loading) return <div style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading history...</div>;
    if (!versions || !Array.isArray(versions) || versions.length === 0) return null;

    // Filter: Oldest version is usually the "Original Bill" if we saved it as PRE-UPDATE.
    // Actually, backend logic: We save "PRE-UPDATE" version before update.
    // So the versions list contains [Version 2 (if 2 updates), Version 1 (Original)].
    // The versions search returns Descending order (Latest first).
    // So versions[0] is most recent history (the state BEFORE the last edit).
    // versions[last] is the Original state.

    return (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>HISTORY & MODIFICATIONS</div>
            {versions.map((ver, idx) => (
                <div key={ver.id} style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', border: '1px dashed var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        <div>
                            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                                {ver.versionReason || "Original Bill"}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {new Date(ver.versionAt).toLocaleString()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Total: Rs. {ver.totalAmount?.toFixed(2)}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cashier: {ver.cashierName}</div>
                        </div>
                    </div>

                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '0.25rem', color: 'var(--text-secondary)' }}>Item</th>
                                <th style={{ textAlign: 'left', padding: '0.25rem', color: 'var(--text-secondary)' }}>Barcode</th>
                                <th style={{ textAlign: 'center', padding: '0.25rem', color: 'var(--text-secondary)' }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '0.25rem', color: 'var(--text-secondary)' }}>Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ver.items?.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '0.25rem' }}>{item.productName}</td>
                                    <td style={{ padding: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.barcode || '-'}</td>
                                    <td style={{ padding: '0.25rem', textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ padding: '0.25rem', textAlign: 'right' }}>{item.price?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default DailySalesTable;
