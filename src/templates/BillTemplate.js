export const printReceipt = (serverSale) => {
    const printWindow = window.open('', '_blank');

    // Rows with Item-Level Discount Logic
    const rows = (serverSale.items || []).map(item => {
        const name = item.productName || item.name || "Item";
        // Check if item has a known discount from cart or backend
        const discountPercent = item.discount || 0;
        const price = item.price || 0;
        const quantity = item.quantity || 0;

        // Backend usually returns the "sell price" (unit price).
        // We calculate the specific amounts for the receipt.
        const grossTotal = price * quantity;
        const discountAmount = (price * (discountPercent / 100)) * quantity;

        let html = `
        <tr>
            <td class="col-item">${name}</td>
            <td class="col-qty">${quantity}</td>
            <td class="col-price">${price.toFixed(2)}</td>
            <td class="col-total">${grossTotal.toFixed(2)}</td>
        </tr>`;

        if (discountPercent > 0) {
            html += `
            <tr style="font-size: 11px; font-style: italic; color: #444;">
                <td colspan="3" style="text-align: right; padding-right: 5px;">(Disc ${discountPercent}%)</td>
                <td style="text-align: right;">-${discountAmount.toFixed(2)}</td>
            </tr>`;
        }
        return html;
    }).join('');

    const html = `
        <html>
            <head>
                <title>Bill #${serverSale.id || ''}</title>
                <style>
                    @page { margin: 0; size: auto; }
                    body { 
                        font-family: 'Courier New', monospace; 
                        margin: 0 auto; 
                        padding: 5px; 
                        font-size: 13px; 
                        line-height: 1.2; 
                        width: 79mm; 
                        color: #000;
                    }
                    
                    .header { text-align: center; margin-bottom: 10px; }
                    .store-name { font-size: 16pt; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
                    
                    .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-bottom: 5px; table-layout: fixed; font-size: 11px; }
                    th { border-bottom: 1px dashed #000; padding: 5px 0; text-align: left; font-weight: bold; }
                    td { padding: 4px 0; vertical-align: top; }
                    
                    .col-item { width: 30%; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 2px; }
                    .col-qty { width: 10%; text-align: center; }
                    .col-price { width: 28%; text-align: right; padding-right: 2px; }
                    .col-total { width: 32%; text-align: right; }
                    
                    .total-section { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
                    .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                    
                    .grand-total { 
                        font-size: 16px; 
                        font-weight: bold; 
                        border-top: 1px double #000; 
                        border-bottom: 1px double #000; 
                        padding: 5px 0; 
                        margin-top: 5px; 
                        margin-bottom: 5px;
                    }
                    
                    .footer { margin-top: 15px; font-size: 10px; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="store-name">NK Enterprice</div>
                    <div>Your Hardware Partner</div>
                    <div>Kosgama Showroom</div>
                </div>

                <div class="meta">
                    <div style="text-align: left;">
                        <div>${new Date().toLocaleDateString()}</div>
                        <div>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 12px; font-weight: bold;">Bill #${serverSale.id || '-'}</div>
                        <div>Cashier: ${serverSale.cashierName || 'Staff'}</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th class="col-item">Item</th>
                            <th class="col-qty" style="text-align: center;">Qty</th>
                            <th class="col-price" style="text-align: right;">Price</th>
                            <th class="col-total" style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
                
                <div class="total-section">
                    ${serverSale.discountPercent > 0 ? `
                    <div class="row">
                        <div>Subtotal</div>
                        <div>${(serverSale.subtotal || 0).toFixed(2)}</div>
                    </div>
                    <div class="row" style="color: #444; font-style: italic;">
                        <div>Discount (${serverSale.discountPercent}%)</div>
                        <div>-${(serverSale.subtotal * serverSale.discountPercent / 100).toFixed(2)}</div>
                    </div>
                    ` : ''}
                    <div class="row grand-total">
                        <div>TOTAL</div>
                        <div>${(serverSale.totalAmount || 0).toFixed(2)}</div>
                    </div>
                    <div class="row" style="margin-top: 5px;">
                        <div>Payment Method</div>
                        <div style="font-size: 11px;">${serverSale.paymentMethod}</div>
                    </div>
                    ${(serverSale.cashGiven && serverSale.cashGiven > 0) ? `
                    <div class="row">
                        <div>Cash Given</div>
                        <div>${Number(serverSale.cashGiven).toFixed(2)}</div>
                    </div>` : ''}
                    ${serverSale.change > 0 ? `
                    <div class="row">
                        <div>Change</div>
                        <div>${serverSale.change.toFixed(2)}</div>
                    </div>` : ''}
                </div>

                <div class="footer">
                    Thank you!<br>
                    Please Come Again<br>
                    <div style="margin-top: 5px; font-weight: bold; border-top: 1px dotted #ccc; padding-top:2px;">
                        * Items exchangeable within 3 days *
                    </div>
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
