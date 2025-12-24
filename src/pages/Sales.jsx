import React, { useState } from 'react';
import { useSales } from '../api/sales';
import { useStore } from '../context/StoreContext';
import SalesLogsModal from '../components/sales/SalesLogsModal';
import LogsDropdown from '../components/LogsDropdown';

const Sales = () => {
    const { selectedStoreId, role } = useStore();
    const isOwner = role === 'OWNER';

    // Data Fetching
    const { data: sales = [], isLoading } = useSales(selectedStoreId);

    // Logs State
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [logFilter, setLogFilter] = useState(null);

    const handleLogFilterChange = (filter) => {
        setLogFilter(filter);
    };

    return (
        <div>
            {/* Header with Logs Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', paddingRight: '1rem' }}>
                <LogsDropdown
                    onFilterChange={handleLogFilterChange}
                    onOpenLogs={() => setIsLogsModalOpen(true)}
                />
            </div>

            <div className="card" style={{ marginTop: '0' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Bill No</th>
                            <th>Date</th>
                            <th>Cashier</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Payment</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => (
                            <tr key={sale.id}>
                                <td>#{sale.id}</td>
                                <td>{new Date(sale.saleDate).toLocaleString()}</td>
                                <td>{sale.cashierName || '-'}</td>
                                <td>{sale.items?.length || 0} items</td>
                                <td>Rs. {sale.totalAmount?.toFixed(2)}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                        backgroundColor: sale.paymentMethod === 'CASH' ? 'var(--success)' : '#8b5cf6',
                                        fontSize: '0.8rem'
                                    }}>
                                        {sale.paymentMethod}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <SalesLogsModal
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                filter={logFilter}
                storeId={selectedStoreId}
            />
        </div>
    );
};

export default Sales;
