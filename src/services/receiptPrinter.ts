import { Order } from '../types';
import { settingsService } from '../services/database';

// Enhanced Receipt Printing System
export class ReceiptPrinter {
  
  // Get receipt settings from database
  static async getReceiptSettings() {
    try {
      const settings = await settingsService.get('receipt') as {
        headerText?: string;
        footerText?: string;
        businessName?: string;
        address?: string;
        phone?: string;
        showLogo?: boolean;
        paperSize?: string;
        autoPrint?: boolean;
      };
      
      return {
        headerText: settings?.headerText || '2nd Eden Restaurant',
        footerText: settings?.footerText || 'Thank you for dining with us!',
        businessName: settings?.businessName || '2nd Eden Restaurant',
        address: settings?.address || '123 Main Street',
        phone: settings?.phone || '(123) 456-7890',
        showLogo: settings?.showLogo !== false,
        paperSize: settings?.paperSize || '80mm',
        autoPrint: settings?.autoPrint !== false
      };
    } catch (error) {
      console.warn('Could not load receipt settings, using defaults:', error);
      return {
        headerText: '2nd Eden Restaurant',
        footerText: 'Thank you for dining with us!',
        businessName: '2nd Eden Restaurant',
        address: '123 Main Street',
        phone: '(123) 456-7890',
        showLogo: true,
        paperSize: '80mm',
        autoPrint: true
      };
    }
  }

  // Generate thermal printer compatible receipt content
  static async generateThermalReceipt(order: Order): Promise<string> {
    const settings = await this.getReceiptSettings();
    
    return `
      <html>
        <head>
          <title>Receipt - Order ${order.id}</title>
          <style>
            @media print {
              @page {
                size: ${settings.paperSize === '58mm' ? '58mm' : '80mm'} auto;
                margin: 2mm;
              }
              body { 
                font-family: 'Courier New', monospace;
                font-size: ${settings.paperSize === '58mm' ? '10px' : '12px'};
                width: 100%;
                margin: 0;
                padding: 0;
                line-height: 1.1;
                color: #000;
                -webkit-print-color-adjust: exact;
              }
              .center { text-align: center; }
              .left { text-align: left; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .large { font-size: 16px; }
              .medium { font-size: 14px; }
              .small { font-size: 10px; }
              .line { 
                border-bottom: 1px dashed #000; 
                margin: 3px 0; 
                width: 100%;
                box-sizing: border-box;
              }
              .double-line { 
                border-bottom: 2px solid #000; 
                margin: 5px 0; 
                width: 100%;
              }
              .item-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 1px 0;
                width: 100%;
              }
              .item-name {
                flex: 1;
                text-align: left;
                padding-right: 5px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
              .item-qty {
                width: 30px;
                text-align: center;
              }
              .item-price {
                width: 50px;
                text-align: right;
              }
              .no-print { display: none; }
              .receipt-content {
                width: 100%;
                box-sizing: border-box;
              }
            }
            @media screen {
              body { 
                font-family: 'Courier New', monospace;
                max-width: ${settings.paperSize === '58mm' ? '220px' : '300px'};
                margin: 20px auto;
                padding: 15px;
                border: 1px solid #ccc;
                background: white;
              }
              .center { text-align: center; }
              .left { text-align: left; }
              .right { text-align: right; }
              .bold { font-weight: bold; }
              .large { font-size: 18px; }
              .medium { font-size: 16px; }
              .small { font-size: 12px; }
              .line { border-bottom: 1px dashed #000; margin: 8px 0; }
              .double-line { border-bottom: 2px solid #000; margin: 10px 0; }
              .item-row { display: flex; justify-content: space-between; margin: 3px 0; }
              .item-name { flex: 1; text-align: left; padding-right: 10px; }
              .item-qty { width: 40px; text-align: center; }
              .item-price { width: 60px; text-align: right; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-content">
            ${settings.showLogo ? `
            <div class="center">
              <!-- Logo placeholder - can be replaced with actual logo -->
              <div class="bold large" style="margin-bottom: 5px;">🍽️</div>
            </div>
            ` : ''}
            
            <div class="center bold large">${settings.businessName}</div>
            <div class="center small">${settings.address}</div>
            <div class="center small">Phone: ${settings.phone}</div>
            <div class="line"></div>
            
            <div class="item-row">
              <span class="left"><strong>Order #:</strong></span>
              <span class="right">${order.id}</span>
            </div>
            <div class="item-row">
              <span class="left"><strong>Date:</strong></span>
              <span class="right">${order.timestamp.toLocaleDateString()}</span>
            </div>
            <div class="item-row">
              <span class="left"><strong>Time:</strong></span>
              <span class="right">${order.timestamp.toLocaleTimeString()}</span>
            </div>
            <div class="item-row">
              <span class="left"><strong>Table:</strong></span>
              <span class="right">${order.tableNumber || 'Takeaway'}</span>
            </div>
            <div class="item-row">
              <span class="left"><strong>Payment:</strong></span>
              <span class="right">${order.paymentMethod?.toUpperCase() || 'CASH'}</span>
            </div>
            
            <div class="double-line"></div>
            
            <div class="bold center medium">ORDER DETAILS</div>
            <div class="line"></div>
            
            ${order.items.map(item => `
              <div class="item-row">
                <span class="item-name">${item.menuItem.name}</span>
                <span class="item-qty">x${item.quantity}</span>
                <span class="item-price">$${(item.menuItem.price * item.quantity).toFixed(2)}</span>
              </div>
              ${item.notes ? `
                <div class="small" style="margin-left: 5px; font-style: italic; color: #666;">
                  Note: ${item.notes}
                </div>
              ` : ''}
            `).join('')}
            
            <div class="line"></div>
            
            <div class="item-row bold medium">
              <span>TOTAL:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
            
            <div class="double-line"></div>
            
            <div class="center">
              <div class="bold">${settings.footerText}</div>
              <div class="small" style="margin-top: 10px;">
                Order processed on ${new Date().toLocaleString()}
              </div>
              <div class="small">
                Served by: Staff
              </div>
            </div>
            
            <div class="center small" style="margin-top: 15px;">
              <div>Visit us again soon!</div>
              <div>⭐⭐⭐⭐⭐</div>
            </div>
            
            <!-- QR Code placeholder for digital receipt/feedback -->
            <div class="center" style="margin-top: 10px;">
              <div class="small">Scan for digital receipt:</div>
              <div style="font-size: 20px;">📱 QR</div>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin: 5px;">
              🖨️ Print Receipt
            </button>
            <button onclick="window.close()" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin: 5px;">
              ✖️ Close
            </button>
            <button onclick="printMultiple()" style="padding: 12px 24px; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin: 5px;">
              📄 Print Multiple
            </button>
          </div>
          
          <script>
            // Print multiple copies function
            function printMultiple() {
              const copies = prompt('How many copies do you want to print?', '2');
              if (copies && !isNaN(copies) && copies > 0) {
                for (let i = 0; i < parseInt(copies); i++) {
                  setTimeout(() => window.print(), i * 1000);
                }
              }
            }
            
            // Auto-print if enabled in settings
            ${settings.autoPrint ? `
            window.addEventListener('load', () => {
              setTimeout(() => {
                window.print();
              }, 800);
            });
            ` : ''}
          </script>
        </body>
      </html>
    `;
  }

  // Print receipt with enhanced functionality
  static async printReceipt(order: Order, options: {
    copies?: number;
    autoPrint?: boolean;
    showPreview?: boolean;
  } = {}) {
    try {
      console.log('🖨️ Generating receipt for order:', order.id);
      
      const receiptContent = await this.generateThermalReceipt(order);
      const settings = await this.getReceiptSettings();
      
      const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
      
      if (!printWindow) {
        throw new Error('Could not open print window. Please check popup blocker settings.');
      }

      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Auto-print logic
      const shouldAutoPrint = options.autoPrint !== false && settings.autoPrint;
      const copies = options.copies || 1;
      
      if (shouldAutoPrint && !options.showPreview) {
        setTimeout(() => {
          for (let i = 0; i < copies; i++) {
            setTimeout(() => {
              printWindow.print();
            }, i * 1000); // 1 second delay between copies
          }
        }, 800);
      }

      console.log('✅ Receipt generated successfully');
      return printWindow;
      
    } catch (error) {
      console.error('❌ Receipt printing failed:', error);
      throw error;
    }
  }

  // Print kitchen order (simplified version for kitchen staff)
  static async printKitchenOrder(order: Order) {
    const kitchenContent = `
      <html>
        <head>
          <title>Kitchen Order - ${order.id}</title>
          <style>
            @media print {
              body { 
                font-family: 'Arial', sans-serif;
                font-size: 14px;
                margin: 0;
                padding: 10px;
                line-height: 1.3;
              }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .large { font-size: 18px; }
              .line { border-bottom: 2px solid #000; margin: 10px 0; }
              .urgent { background-color: #ffcccc; padding: 5px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="center bold large">KITCHEN ORDER</div>
          <div class="line"></div>
          
          <div class="bold">Order #: ${order.id}</div>
          <div class="bold">Table: ${order.tableNumber || 'TAKEAWAY'}</div>
          <div class="bold">Time: ${order.timestamp.toLocaleTimeString()}</div>
          
          <div class="line"></div>
          
          <div class="bold large">ITEMS TO PREPARE:</div>
          
          ${order.items.map(item => `
            <div style="margin: 10px 0; padding: 5px; border: 1px solid #ccc;">
              <div class="bold large">${item.quantity}x ${item.menuItem.name}</div>
              ${item.notes ? `<div style="color: red; font-weight: bold;">Special Instructions: ${item.notes}</div>` : ''}
            </div>
          `).join('')}
          
          <div class="line"></div>
          <div class="center bold">Order Total: $${order.total.toFixed(2)}</div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 15px 30px; background: #ff6b35; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
              🔥 Print Kitchen Order
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(kitchenContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  }

  // Print refund receipt with enhanced formatting
  static async printRefundReceipt(refundData: {
    refundId: string;
    originalOrderId: string;
    refundType: 'full' | 'partial' | 'exchange';
    refundAmount: number;
    reason: string;
    refundMethod: string;
    processedBy: string;
    originalOrder: Order;
  }) {
    console.log('🧾 Printing refund receipt for:', refundData.refundId);
    
    const settings = await this.getReceiptSettings();
    
    const refundContent = `
      <html>
        <head>
          <title>REFUND RECEIPT - ${refundData.refundId}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              line-height: 1.3;
              margin: 0;
              padding: 20px;
              font-size: 14px;
              background: white;
            }
            .receipt {
              width: 100%;
              max-width: 350px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border: 2px solid #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { 
              border-top: 2px dashed #000; 
              margin: 15px 0; 
              height: 1px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
              padding: 2px 0;
            }
            .refund-header {
              font-size: 20px;
              font-weight: bold;
              background: #ff4444;
              color: white;
              padding: 15px;
              text-align: center;
              margin: 15px 0;
              border-radius: 5px;
              letter-spacing: 2px;
            }
            .refund-amount {
              font-size: 24px;
              font-weight: bold;
              background: #ffeeee;
              padding: 15px;
              text-align: center;
              margin: 15px 0;
              border: 2px solid #ff4444;
              color: #ff4444;
            }
            .info-section {
              background: #f9f9f9;
              padding: 10px;
              margin: 10px 0;
              border-left: 4px solid #ff4444;
            }
            .print-button {
              display: block;
              width: 100%;
              padding: 15px;
              background: #ff4444;
              color: white;
              border: none;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              margin: 20px 0;
            }
            .print-button:hover {
              background: #cc3333;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .receipt { border: none; max-width: none; }
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="center bold" style="font-size: 18px; margin-bottom: 10px;">
              ${settings.businessName}
            </div>
            <div class="center" style="font-size: 12px;">
              ${settings.address}<br>
              ${settings.phone}
            </div>
            
            <div class="refund-header">
              *** REFUND RECEIPT ***
            </div>
            
            <div class="info-section">
              <div><strong>🔄 Refund ID:</strong> ${refundData.refundId}</div>
              <div><strong>📦 Original Order:</strong> #${refundData.originalOrderId}</div>
              <div><strong>📅 Date & Time:</strong> ${new Date().toLocaleString()}</div>
              <div><strong>🔖 Type:</strong> ${refundData.refundType.toUpperCase()} REFUND</div>
              <div><strong>📝 Reason:</strong> ${refundData.reason}</div>
              <div><strong>👤 Processed by:</strong> ${refundData.processedBy}</div>
            </div>
            
            <div class="line"></div>
            
            <div class="center bold" style="font-size: 16px; margin: 15px 0;">
              REFUNDED ITEMS
            </div>
            
            ${refundData.refundType === 'full' ? 
              refundData.originalOrder.items.map(item => `
                <div class="item-row">
                  <span>🍽️ ${item.quantity}x ${item.menuItem.name}</span>
                  <span style="color: #ff4444; font-weight: bold;">-$${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('') : 
              `<div class="center info-section">
                <strong>Partial Refund:</strong> Custom amount of $${refundData.refundAmount.toFixed(2)}
              </div>`
            }
            
            <div class="line"></div>
            
            <div class="refund-amount">
              💰 TOTAL REFUND: $${refundData.refundAmount.toFixed(2)}
            </div>
            
            <div class="line"></div>
            
            <div class="info-section">
              <div><strong>💳 Refund Method:</strong> ${refundData.refundMethod.replace('_', ' ').toUpperCase()}</div>
              <div style="margin-top: 15px; text-align: center; font-size: 12px; color: #666;">
                ⚠️ <strong>IMPORTANT:</strong><br>
                Please keep this receipt for your records.<br>
                Refund will be processed to original payment method.<br>
                Allow 3-5 business days for credit card refunds.
              </div>
            </div>
            
            <div class="line"></div>
            
            <div class="center" style="font-size: 12px; margin: 20px 0; color: #666;">
              ${settings.footerText}<br>
              <strong>Thank you for your understanding!</strong>
            </div>
            
            <button class="print-button" onclick="window.print()">
              🖨️ PRINT THIS RECEIPT
            </button>
            
            <div class="center" style="font-size: 10px; color: #999; margin-top: 10px;">
              Receipt ID: ${refundData.refundId} | ${new Date().toISOString()}
            </div>
          </div>
          
          <script>
            // Auto-print after a short delay
            setTimeout(() => {
              window.print();
            }, 1000);
            
            // Auto-close after printing
            window.addEventListener('afterprint', () => {
              setTimeout(() => {
                window.close();
              }, 2000);
            });
          </script>
        </body>
      </html>
    `;

    // Always show the receipt in a new window
    console.log('🖨️ Opening refund receipt window...');
    const printWindow = window.open('', '_blank', 'width=400,height=800,scrollbars=yes');
    
    if (printWindow) {
      printWindow.document.write(refundContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Add error handling for print
      printWindow.addEventListener('load', () => {
        console.log('✅ Refund receipt loaded successfully');
      });
      
      printWindow.addEventListener('error', (error) => {
        console.error('❌ Refund receipt error:', error);
      });
      
      console.log('✅ Refund receipt window opened successfully');
    } else {
      console.error('❌ Could not open refund receipt window - popup blocked?');
      
      // Fallback: show receipt content in console
      console.log('📄 REFUND RECEIPT CONTENT:');
      console.log(`Refund ID: ${refundData.refundId}`);
      console.log(`Original Order: #${refundData.originalOrderId}`);
      console.log(`Amount: $${refundData.refundAmount.toFixed(2)}`);
      console.log(`Reason: ${refundData.reason}`);
      console.log(`Type: ${refundData.refundType.toUpperCase()} REFUND`);
      
      // Show alert as additional fallback
      alert(`🧾 REFUND RECEIPT\n\nRefund ID: ${refundData.refundId}\nOrder: #${refundData.originalOrderId}\nAmount: $${refundData.refundAmount.toFixed(2)}\nReason: ${refundData.reason}\n\nRefund processed successfully!`);
    }
  }

  // Test printer functionality
  static testPrinter() {
    const testContent = `
      <html>
        <head><title>Printer Test</title></head>
        <body style="font-family: Courier New; padding: 20px;">
          <div style="text-align: center;">
            <h2>🖨️ PRINTER TEST</h2>
            <p>If you can see this page and print it, your receipt printer setup is working correctly.</p>
            <p>Test Date: ${new Date().toLocaleString()}</p>
            <p>✅ Printer Status: OK</p>
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px;">Print Test Page</button>
          </div>
        </body>
      </html>
    `;

    const testWindow = window.open('', '_blank');
    if (testWindow) {
      testWindow.document.write(testContent);
      testWindow.document.close();
      testWindow.focus();
    }
  }
}

// Export for global use
export default ReceiptPrinter;