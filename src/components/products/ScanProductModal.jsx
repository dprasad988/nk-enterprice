import React, { useEffect } from 'react';
import Modal from '../Modal';
import { Html5QrcodeScanner } from 'html5-qrcode';

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

const ScanProductModal = ({ isOpen, onClose, onScan }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scan Product"
        >
            <div style={{ padding: '1rem' }}>
                <div id="reader" width="100%"></div>
                <ScannerHelper isOpen={isOpen} onScan={onScan} />
            </div>
        </Modal>
    );
};

export default ScanProductModal;
