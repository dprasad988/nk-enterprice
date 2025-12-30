import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight, QrCode, ScanLine, History } from 'lucide-react';
import { useProductsPaged, createProduct, updateProduct, deleteProduct } from '../api/products';
import { useStore } from '../context/StoreContext';
import { useQueryClient } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import ImportPreviewModal from '../components/products/ImportPreviewModal';

// Components
import LogsDropdown from '../components/LogsDropdown';
import ProductLogsModal from '../components/products/ProductLogsModal';
import ProductFormModal from '../components/products/ProductFormModal';
import DeleteProductModal from '../components/products/DeleteProductModal';
import ProductQrModal from '../components/products/ProductQrModal';
import ScanProductModal from '../components/products/ScanProductModal';

import { useAlert } from '../context/AlertContext';

const Products = () => {
    const { selectedStoreId, role } = useStore();
    const isOwner = role === 'OWNER';
    const queryClient = useQueryClient();
    const { showAlert } = useAlert();

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    // Import Preview State
    const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
    const [importPreviewData, setImportPreviewData] = useState({ newItems: [], updates: [] });
    const [importProcessing, setImportProcessing] = useState(false);

    // QR State
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedQrProduct, setSelectedQrProduct] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    // const [scannerResult, setScannerResult] = useState(null); // Unused currently
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [logFilter, setLogFilter] = useState({ startDate: null, endDate: null });

    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        price: '',
        costPrice: '',
        discount: '',
        stock: '',
        alertLevel: 5
    });

    const [manualLoading, setManualLoading] = useState(false); // For file upload

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fileInputRef = useRef(null);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data, isLoading } = useProductsPaged({
        storeId: selectedStoreId,
        page: currentPage - 1,
        size: itemsPerPage,
        search: debouncedSearch
    });

    const products = data?.content || [];
    const totalPages = data?.totalPages || 1;
    const totalItems = data?.totalElements || 0;
    const loading = isLoading || manualLoading;

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // Helper to clean formatted numbers
    const parseNumber = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        const str = String(val).replace(/[^0-9.-]/g, '');
        return parseFloat(str) || 0;
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                // 1. Read Excel
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { raw: false });

                if (data.length === 0) {
                    showAlert("Excel file is empty!");
                    e.target.value = '';
                    return;
                }

                setManualLoading(true);

                // 2. Fetch ALL existing products to compare
                const { fetchProducts } = await import('../api/products');
                const existingProducts = await fetchProducts(selectedStoreId);

                const productMap = new Map();
                existingProducts.forEach(p => productMap.set(p.barcode, p));

                const newItems = [];
                const updates = [];
                const seenBarcodesInFile = new Set();
                const duplicates = [];

                // 3. Compare Items
                for (const row of data) {
                    const barcode = String(row.Barcode || row.barcode || '').trim();
                    const name = row.Name || row.name;

                    if (!barcode || !name) continue;

                    if (seenBarcodesInFile.has(barcode)) {
                        duplicates.push(barcode);
                        continue;
                    }
                    seenBarcodesInFile.add(barcode);

                    const payload = {
                        name: row.Name || row.name,
                        barcode: barcode,
                        price: parseNumber(row.Price || row.price),
                        costPrice: parseNumber(row.Cost || row.cost),
                        stock: parseInt(String(row.Stock || row.stock).replace(/[^0-9]/g, '') || 0),
                        alertLevel: parseInt(String(row.Alert || row.alert || 5).replace(/[^0-9]/g, '') || 5),
                        storeId: selectedStoreId
                    };

                    if (productMap.has(barcode)) {
                        const original = productMap.get(barcode);
                        // Add to updates list
                        updates.push({
                            original: original,
                            new: payload
                        });
                    } else {
                        // Add to new list
                        newItems.push(payload);
                    }
                }

                if (duplicates.length > 0) {
                    showAlert(`Warning: Skipped ${duplicates.length} duplicate barcodes in file.`);
                }

                setImportPreviewData({ newItems, updates });
                setIsImportPreviewOpen(true);

            } catch (error) {
                // Upload error

                showAlert("Failed to parse file: " + error.message);
            } finally {
                setManualLoading(false);
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleConfirmImport = async () => {
        setImportProcessing(true);
        const { newItems, updates } = importPreviewData;
        let successCount = 0;
        let errorCount = 0;

        try {
            // Process New Items
            for (const item of newItems) {
                try {
                    await createProduct(item);
                    successCount++;
                } catch (e) {
                    // Add failed

                    errorCount++;
                }
            }

            // Process Updates
            for (const item of updates) {
                try {
                    // Update Product
                    // Ensure we pass the ID
                    await updateProduct(item.original.productId, item.new);
                    successCount++;
                } catch (e) {
                    // Update failed

                    errorCount++;
                }
            }

            showAlert(`Import Completed. Success: ${successCount}, Errors: ${errorCount}`, errorCount > 0 ? 'warning' : 'success');
            setIsImportPreviewOpen(false);
            setImportPreviewData({ newItems: [], updates: [] });
            queryClient.invalidateQueries({ queryKey: ['products'] });

        } catch (error) {
            showAlert("Critial Process Error: " + error.message);
        } finally {
            setImportProcessing(false);
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ name: '', barcode: '', price: '', costPrice: '', discount: '', stock: '', alertLevel: 5 });
        setEditingId(null);
        setIsModalOpen(false);
    };

    const handleAddNew = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleEditClick = (product) => {
        setFormData({
            name: product.name,
            barcode: product.barcode || '',
            price: product.price,
            costPrice: product.costPrice || '',
            discount: product.discount || '',
            stock: product.stock,
            alertLevel: product.alertLevel || 5
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                costPrice: parseFloat(formData.costPrice) || 0,
                discount: parseFloat(formData.discount || 0),
                stock: parseInt(formData.stock),
                alertLevel: parseInt(formData.alertLevel)
            };

            if (selectedStoreId) {
                payload.storeId = selectedStoreId;
            }

            if (editingId) {
                await updateProduct(editingId, payload);
            } else {
                await createProduct(payload);
            }

            resetForm();
            queryClient.invalidateQueries({ queryKey: ['products'] });
        } catch (error) {
            showAlert('Failed to save product: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete.id, selectedStoreId);
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            showAlert("Product deleted successfully", "success");
        } catch (error) {
            console.error("Error deleting product", error);
            const errMsg = error.response?.data?.message || "Failed to delete product";
            showAlert(errMsg);
        }
    };

    // Client-side filtering removed in favor of Server-side search


    return (
        <div>
            <div className="header-actions">

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {isOwner && (
                        <>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                            />
                            <button className="btn" onClick={handleImportClick} style={{ backgroundColor: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Import Excel
                            </button>
                        </>
                    )}
                    {isOwner && (
                        <button className="btn" onClick={() => setIsScannerOpen(true)} style={{ backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ScanLine size={16} /> Scan QR
                        </button>
                    )}
                    {isOwner && (
                        <button className="btn btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={16} /> Add Product
                        </button>
                    )}
                </div>

                <LogsDropdown
                    onFilterChange={(filter) => {
                        if (filter === 'ALL') setLogFilter({ startDate: null, endDate: null });
                        else if (filter === 'CUSTOM') { /* Logic handled in Modal or Dropdown doesn't pass dates yet */
                            // For CUSTOM, we pass a flag or let Modal handle it. 
                            // Based on my dropdown logic: handleSelect('CUSTOM') sets filter to 'CUSTOM'.
                            setLogFilter('CUSTOM');
                        }
                        else setLogFilter(filter); // { startDate, endDate }
                    }}
                    onOpenLogs={() => setIsLogsModalOpen(true)}
                />
            </div>

            <div className="card">
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Search by name or barcode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                </div>

                {loading ? <p>Loading...</p> : (
                    <table>
                        <thead>
                            <tr>

                                <th>Name</th>
                                <th>Barcode</th>
                                <th>Stock</th>
                                <th>Price</th>
                                <th>Disc (%)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>

                                    <td>{product.name}</td>
                                    <td>{product.barcode}</td>

                                    <td>
                                        <span style={{ color: product.stock < product.alertLevel ? 'var(--danger)' : 'var(--success)' }}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>Rs. {product.price?.toFixed(2)}</td>
                                    <td>{product.discount > 0 ? product.discount + '%' : '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn"
                                                style={{ padding: '0.25rem', color: 'var(--accent-color)' }}
                                                onClick={() => handleEditClick(product)}
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                className="btn"
                                                style={{ padding: '0.25rem', color: '#4f46e5' }}
                                                onClick={() => {
                                                    setSelectedQrProduct(product);
                                                    setIsQrModalOpen(true);
                                                }}
                                                title="View QR Code"
                                            >
                                                <QrCode size={16} />
                                            </button>
                                            {isOwner && (
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.25rem', color: 'var(--danger)' }}
                                                    onClick={() => handleDeleteClick(product)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {!loading && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                            Total Products: {totalItems}
                        </span>

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{
                                        backgroundColor: currentPage === 1 ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                                        color: currentPage === 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        backgroundColor: currentPage === totalPages ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
                                        color: currentPage === totalPages ? 'var(--text-secondary)' : 'var(--text-primary)',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Product Form Modal */}
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={resetForm}
                onSubmit={handleSaveProduct}
                formData={formData}
                onChange={handleInputChange}
                isOwner={isOwner}
                editingId={editingId}
            />

            {/* Import Preview Modal */}
            <ImportPreviewModal
                isOpen={isImportPreviewOpen}
                onClose={() => setIsImportPreviewOpen(false)}
                data={importPreviewData}
                onConfirm={handleConfirmImport}
                isProcessing={importProcessing}
            />

            {/* Delete Confirmation Modal */}
            <DeleteProductModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                productName={productToDelete?.name}
            />

            {/* View QR Code Modal */}
            <ProductQrModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                product={selectedQrProduct}
            />

            {/* Qrcode Scanner Modal */}
            <ScanProductModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={(decodedText) => {
                    setIsScannerOpen(false); // Close scanner

                    // Parse "Name: ... | Price: ... | Code: ..." format
                    let scannedBarcode = decodedText;
                    let scannedName = null;

                    // Check new format
                    if (decodedText.includes(' | Code: ')) {
                        const parts = decodedText.split(' | ');
                        const codePart = parts.find(p => p.startsWith('Code: '));
                        const namePart = parts.find(p => p.startsWith('Name: '));

                        if (codePart) scannedBarcode = codePart.replace('Code: ', '').trim();
                        if (namePart) scannedName = namePart.replace('Name: ', '').trim();
                    }
                    // Fallback to old format (Barcode:::Name)
                    else if (decodedText.includes(':::')) {
                        const parts = decodedText.split(':::');
                        scannedBarcode = parts[0];
                        scannedName = parts[1];
                    }

                    // 1. Search Logic
                    const found = products.find(p => p.barcode === scannedBarcode);

                    if (found) {
                        showAlert(`Product found: ${found.name}`, 'success');
                        handleEditClick(found);
                    } else {
                        // If name existed in QR but not in DB, use it for context
                        const msg = scannedName
                            ? `New item scanned: ${scannedName} (${scannedBarcode})`
                            : `New barcode scanned: ${scannedBarcode}`;

                        showAlert(`${msg}. Add details.`, 'success');
                        handleAddNew();
                        setFormData(prev => ({
                            ...prev,
                            barcode: scannedBarcode,
                            name: scannedName || '' // Pre-fill name 
                        }));
                    }
                }}
            />

            <ProductLogsModal
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                filter={logFilter}
                storeId={selectedStoreId}
            />

        </div >
    );
};

export default Products;
