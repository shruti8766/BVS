// src/admin_dashboard/components/InvoiceTemplate.js
import React from 'react';

const InvoiceTemplate = ({ bill }) => {
  // Safe defaults utility
  const safe = (v, fb) => (v !== undefined && v !== null ? v : fb);
  const safeNum = (v, fb = 0) => (isNaN(parseFloat(v)) ? fb : parseFloat(v));

  const amount = safeNum(bill?.amount, 0);
  const taxRate = safeNum(bill?.tax_rate, 5);
  const discount = safeNum(bill?.discount, 0);
  const subtotal = amount - (taxRate / 100 * amount) - discount;
  const tax = (taxRate / 100 * amount);

  return (
    <div>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .invoice-container {
          max-width: 850px;
          margin: 0 auto;
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          font-family: 'Georgia', 'Times New Roman', serif;
        }
        
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4a7c2c;
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 16px;
          font-family: 'Georgia', serif;
          cursor: pointer;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 1000;
        }
        
        .print-button:hover {
          background: #2d5016;
        }
        
        .header {
          background: linear-gradient(135deg, #2d5016 0%, #4a7c2c 100%);
          color: white;
          padding: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .logo img {
          width: 100px;
          height: auto;
        }

        .logo {
          background: none;
          border-radius: 0;
          width: auto;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .company-info h1 {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .company-info p {
          font-size: 13px;
          opacity: 0.9;
        }
        
        .invoice-title {
          text-align: right;
        }
        
        .invoice-title h2 {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 2px;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          padding: 30px;
          background: #f8fdf5;
        }
        
        .info-box h3 {
          color: #2d5016;
          font-size: 14px;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .info-box p {
          color: #333;
          line-height: 1.6;
          font-size: 14px;
        }
        
        .contact-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 5px;
        }
        
        .contact-info svg {
          width: 16px;
          height: 16px;
          fill: #4a7c2c;
        }
        
        .invoice-details {
          background: white;
          padding: 20px 30px;
          border-bottom: 2px solid #4a7c2c;
        }
        
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
        
        .invoice-meta div {
          display: flex;
          gap: 30px;
        }
        
        .invoice-meta strong {
          color: #2d5016;
        }
        
        .items-table {
          padding: 30px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        thead {
          background: #4a7c2c;
          color: white;
        }
        
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        th:last-child, td:last-child {
          text-align: right;
        }
        
        tbody tr {
          border-bottom: 1px solid #e0e0e0;
        }
        
        tbody tr:hover {
          background: #f8fdf5;
        }
        
        td {
          padding: 15px 12px;
          font-size: 14px;
          color: #333;
        }
        
        .item-name {
          font-weight: 600;
          color: #2d5016;
        }
        
        .totals {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        
        .totals-box {
          width: 300px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 14px;
        }
        
        .total-row.subtotal {
          border-top: 1px solid #e0e0e0;
        }
        
        .total-row.tax {
          color: #666;
        }
        
        .total-row.grand-total {
          border-top: 2px solid #4a7c2c;
          font-size: 18px;
          font-weight: bold;
          color: #2d5016;
          padding-top: 15px;
          margin-top: 10px;
        }
        
        .footer {
          background: #f8fdf5;
          padding: 25px 30px;
          margin-top: 30px;
        }
        
        .footer-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        
        .footer h4 {
          color: #2d5016;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .footer p {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }
        
        .thank-you {
          text-align: center;
          padding: 20px;
          background: #2d5016;
          color: white;
          font-size: 14px;
        }

        @media print {
          .print-button {
            display: none;
          }
          
          .invoice-container {
            box-shadow: none;
          }
        }
      `}</style>

      <button className="print-button" onClick={() => window.print()}>🖨️ Print Invoice</button>
      
      <div className="invoice-container">
        <div className="header">
          <div className="logo-section">
            <div className="logo">
              <img src="/logo.png" alt="Fresh Foods Logo" />
            </div>
            <div className="company-info">
              <h1>Bhairavnath Vegetables Supplier</h1>
              <p>Fresh Vegetables • Fruits • Pulses & More</p>
            </div>
          </div>
          <div className="invoice-title">
            <h2>INVOICE</h2>
          </div>
        </div>
        
        <div className="info-section">
          <div className="info-box">
            <h3>From</h3>
            <p><strong>Bhairavnath Vegetables Supplier</strong></p>
            <p>Owner: Maruti Bajirao Gaikwad</p>
            <div className="contact-info">
              <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              <span>surajgaikwad9812@gmail.com</span>
            </div>
            <div className="contact-info">
              <svg viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              <span>+91 9881325644</span>
            </div>
          </div>
          
          <div className="info-box">
            <h3>Bill To</h3>
            <p><strong>{safe(bill?.hotel_name, 'Customer Name')}</strong></p>
            <p>{safe(bill?.address, 'Hotel/Business Address')}</p>
          </div>
        </div>
        
        <div className="invoice-details">
          <div className="invoice-meta">
            <div>
              <span><strong>Invoice No:</strong> BILL-{safe(bill?.id, '001')}</span>
              <span><strong>Date:</strong> {bill?.bill_date ? new Date(bill.bill_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div>
              <span><strong>Due Date:</strong> {bill?.bill_date ? new Date(new Date(bill.bill_date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</span>
            </div>
          </div>
        </div>
        
        <div className="items-table">
          <table>
            <thead>
              <tr>
                <th style={{width: '5%'}}>#</th>
                <th style={{width: '40%'}}>Item Description</th>
                <th style={{width: '15%'}}>Quantity</th>
                <th style={{width: '15%'}}>Unit Price</th>
                <th style={{width: '15%'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill?.items?.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="item-name">{safe(item.product_name, 'Product')}</td>
                  <td>{safe(item.quantity, 0)} {safe(item.unit_type, 'kg')}</td>
                  <td>₹{safeNum(item.price_per_unit).toFixed(2)}</td>
                  <td>₹{(safeNum(item.quantity) * safeNum(item.price_per_unit)).toFixed(2)}</td>
                </tr>
              )) || (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No items available</td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="totals">
            <div className="totals-box">
              <div className="total-row subtotal">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row tax">
                <span>GST ({taxRate}%):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="total-row grand-total">
                <span>TOTAL:</span>
                <span>₹{amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer">
          <div className="footer-content">
            <div>
              <h4>Payment Terms</h4>
              <p>Payment is due within 7 days. We accept cash, bank transfer, UPI.</p>
            </div>
            <div>
              <h4>Bank Details</h4>
              <p><strong>Bank:</strong> State Bank of India<br />
              <strong>A/C No:</strong> 1234567890<br />
              <strong>IFSC:</strong> SBIN0001234</p>
            </div>
          </div>
        </div>
        
        <div className="thank-you">
          Thank you for your business! For queries, contact +91 9881325644.
        </div>
      </div>
    </div>
  );
};

export default InvoiceTemplate;