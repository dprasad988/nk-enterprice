export const printVoucher = (voucher) => {
    const printWindow = window.open('', '_blank');

    const html = `
        <html>
            <head>
                <title>Voucher ${voucher.code || ''}</title>
                <style>
                    @page { margin: 0; size: auto; }
                    body { 
                        font-family: 'Courier New', monospace; 
                        margin: 0 auto; 
                        padding: 10px; 
                        font-size: 13px; 
                        line-height: 1.4; 
                        width: 79mm; 
                        color: #000;
                        text-align: center;
                    }
                    
                    .header { margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
                    .store-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
                    
                    .title { font-size: 16px; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; }
                    .subtitle { font-size: 12px; margin-bottom: 15px; }

                    .voucher-box { 
                        border: 2px solid #000; 
                        padding: 10px; 
                        margin: 10px 0; 
                        font-weight: bold; 
                    }
                    
                    .code-label { font-size: 12px; margin-bottom: 5px; }
                    .voucher-code { font-size: 20px; letter-spacing: 2px; }
                    
                    .amount-section { margin: 20px 0; font-size: 18px; font-weight: bold; }
                    
                    .meta { margin-top: 20px; font-size: 11px; text-align: left; }
                    .row { display: flex; justify-content: space-between; }
                    
                    .footer { margin-top: 25px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="store-name">NK Enerprice</div>
                    <div>Kosgama Showroom</div>
                </div>

                <div class="title">Credit Voucher</div>
                <!-- Subtitle removed -->

                <div class="voucher-box">
                    <div class="code-label">VOUCHER CODE</div>
                    <div class="voucher-code">${voucher.code}</div>
                </div>

                <div class="amount-section">
                    VALUE: Rs. ${(voucher.amount || 0).toFixed(2)}
                </div>

                <div class="meta">
                    <div class="row">
                        <span>Issued Date:</span>
                        <span>${new Date().toLocaleDateString()}</span>
                    </div>
                    ${voucher.expiryDate ? `
                    <div class="row">
                        <span>Valid Until:</span>
                        <span>${new Date(voucher.expiryDate).toLocaleDateString()}</span>
                    </div>` : ''}
                    <div class="row" style="margin-top: 5px; font-weight: bold; color: #000;">
                        <span>Validity:</span>
                        <span>7 DAYS ONLY</span>
                    </div>
                </div>

                <div class="footer">
                    * This voucher is non-refundable and cannot be exchanged for cash.<br>
                    * Please present this slip at the counter for redemption.<br>
                    * Valid for 7 days only.
                </div>

                <script>
                    window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); }
                </script>
            </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
