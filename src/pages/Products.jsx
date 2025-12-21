import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight, QrCode, ScanLine, History } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import Modal from '../components/Modal';
import ProductLogsModal from '../components/products/ProductLogsModal';
import LogsDropdown from '../components/LogsDropdown';
import { fetchProductsPaged, createProduct, updateProduct, deleteProduct } from '../api/products';
import { useStore } from '../context/StoreContext';
import * as XLSX from 'xlsx';

const Products = () => {
    const { selectedStoreId, role } = useStore();
    const isOwner = role === 'OWNER';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    // QR State
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [selectedQrProduct, setSelectedQrProduct] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannerResult, setScannerResult] = useState(null);
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

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 5;

    const [alertInfo, setAlertInfo] = useState({ message: null, type: 'error' });
    const fileInputRef = React.useRef(null);
    const debounceTimeout = React.useRef(null);

    const showAlert = (message, type = 'error') => {
        setAlertInfo({ message, type });
        setTimeout(() => {
            setAlertInfo({ message: null, type: 'error' });
        }, 3000);
    };

    const loadProducts = async (page = 1, search = '') => {
        if (isOwner && !selectedStoreId) return;
        setLoading(true);
        try {
            const params = {
                storeId: selectedStoreId,
                page: page - 1,
                size: itemsPerPage,
                search: search
            };
            const data = await fetchProductsPaged(params);

            if (data.content) {
                setProducts(data.content);
                setTotalPages(data.totalPages);
                setTotalItems(data.totalElements);
            } else {
                setProducts([]);
            }
            setLoading(false);
            return data.content;
        } catch (error) {
            console.error("Error fetching products", error);
            setLoading(false);
            return [];
        }
    };

    useEffect(() => {
        loadProducts(1, '');
    }, [selectedStoreId]);

    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setCurrentPage(1);
            loadProducts(1, searchTerm);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [searchTerm]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            loadProducts(newPage, searchTerm);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    showAlert("Excel file is empty!");
                    return;
                }

                // 1. Fetch latest products for validation - Skipped for performance (Backend validates)
                // const currentProducts = await loadProducts();

                // 2. Validation
                const seenBarcodesInFile = new Set();
                const duplicates = [];

                for (const row of data) {
                    // Map keys (case-insensitive or specific names)
                    // Expected keys: Name, Barcode
                    const barcode = String(row.Barcode || row.barcode || '').trim();
                    const name = row.Name || row.name;

                    if (!barcode || !name) continue; // Skip incomplete

                    // Check duplicate in File
                    if (seenBarcodesInFile.has(barcode)) {
                        duplicates.push(barcode + " (Duplicate in File)");
                    } else {
                        seenBarcodesInFile.add(barcode);
                    }
                }

                if (duplicates.length > 0) {
                    showAlert(`Upload Aborted! Duplicate barcodes found: ${duplicates.join(', ')}`);
                    e.target.value = ''; // Reset input
                    return;
                }

                // 3. Upload if no duplicates
                let successCount = 0;
                setLoading(true);
                for (const row of data) {
                    const payload = {
                        name: row.Name || row.name,
                        barcode: String(row.Barcode || row.barcode || ''),
                        price: parseFloat(row.Price || row.price || 0),
                        costPrice: parseFloat(row.Cost || row.cost || 0),
                        stock: parseInt(row.Stock || row.stock || 0),
                        alertLevel: parseInt(row.Alert || row.alert || 5)
                    };
                    await createProduct(payload);
                    successCount++;
                }

                showAlert(`Successfully uploaded ${successCount} products!`, 'success');
                loadProducts();

            } catch (error) {
                console.error("Upload error", error);
                showAlert("Failed to parse or upload file. Check format.");
            } finally {
                setLoading(false);
                e.target.value = ''; // Reset
            }
        };
        reader.readAsBinaryString(file);
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
                costPrice: parseFloat(formData.costPrice),
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
            loadProducts();
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
            loadProducts();
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
                    <button className="btn" onClick={() => setIsScannerOpen(true)} style={{ backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ScanLine size={16} /> Scan QR
                    </button>
                    <button className="btn btn-primary" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} /> Add Product
                    </button>
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

            {/* Custom Alert Toast */}
            {
                alertInfo.message && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: alertInfo.type === 'success' ? '#22c55e' : '#ef4444',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        zIndex: 2000,
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        animation: 'slideDown 0.3s ease-out'
                    }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '50%', padding: '0.2rem', display: 'flex' }}>
                            <span style={{ color: alertInfo.type === 'success' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                                {alertInfo.type === 'success' ? '✓' : '!'}
                            </span>
                        </div>
                        {alertInfo.message}
                    </div>
                )
            }

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
                                            <button
                                                className="btn"
                                                style={{ padding: '0.25rem', color: 'var(--danger)' }}
                                                onClick={() => handleDeleteClick(product)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
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

            <Modal
                isOpen={isModalOpen}
                onClose={resetForm}
                title={editingId ? "Edit Product" : "Add New Product"}
            >
                <form onSubmit={handleSaveProduct}>
                    <div className="form-group">
                        <label>Product Name</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Barcode</label>
                        <input name="barcode" value={formData.barcode} onChange={handleInputChange} required />
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label>Selling Price (Rs)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" required />
                        </div>
                        <div className="form-group">
                            <label>Cost Price (Rs)</label>
                            <input type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} step="0.01" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label>Discount (%)</label>
                            <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} step="0.1" placeholder="0" />
                        </div>
                        <div></div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="form-group">
                            <label>Initial Stock</label>
                            <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Alert Level</label>
                            <input type="number" name="alertLevel" value={formData.alertLevel} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn" onClick={resetForm} style={{ backgroundColor: 'var(--bg-tertiary)' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">
                            {editingId ? "Update Product" : "Save Product"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Delete"
            >
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                        Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
                        <br />
                        This action cannot be undone.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <button
                            className="btn"
                            onClick={() => setIsDeleteModalOpen(false)}
                            style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={confirmDelete}
                        >
                            Delete Product
                        </button>
                    </div>
                </div>
            </Modal>
            <Modal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                title="Product QR Code"
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '1rem' }}>
                    {selectedQrProduct && (
                        <>
                            <div style={{ padding: '10px', background: 'white', border: '1px solid #ccc' }}>
                                <QRCodeCanvas value={`${selectedQrProduct.barcode}:::${selectedQrProduct.name}` || ""} size={200} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: 0 }}>{selectedQrProduct.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{selectedQrProduct.barcode}</p>
                            </div>
                            <button className="btn" onClick={() => window.print()} style={{ marginTop: '1rem' }}>Print Label</button>
                        </>
                    )}
                </div>
            </Modal>

            {/* Qrcode Scanner Modal */}
            <Modal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                title="Scan Product"
            >
                <div style={{ padding: '1rem' }}>
                    <div id="reader" width="100%"></div>
                    {/* Helper for scanner cleanup and init */}
                    <ScannerHelper
                        isOpen={isScannerOpen}
                        onScan={(decodedText) => {
                            setIsScannerOpen(false); // Close scanner

                            // Parse "Barcode:::Name" format if present
                            let scannedBarcode = decodedText;
                            let scannedName = null;

                            if (decodedText.includes(':::')) {
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
                </div>
            </Modal>

            <ProductLogsModal
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                filter={logFilter}
                storeId={selectedStoreId}
            />

        </div >
    );
};

// Sub-component to handle Lifecycle of HTML5QrcodeScanner
const ScannerHelper = ({ isOpen, onScan }) => {
    useEffect(() => {
        if (!isOpen) return;

        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear();
                onScan(decodedText);
            },
            (error) => {
                // ignore errors during scanning
            }
        );

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, [isOpen]);

    return null;
};

export default Products;
