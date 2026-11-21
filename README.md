# Professional Invoice Builder - Xenmark Garments Edition

A complete, high-performance, and pixel-perfect interactive invoice web application designed to replicate the Xenmark Garments invoice exactly as provided, with modern web capabilities.

---

## ✨ Features

### 1. 🎯 Pixel-Perfect Design Replication (1:1 with Original Image)
- **Top Header:** Xenmark 3-chevron monogram logo, brand name, tagline (`Customise • Printing • Embroidery`), and vertical separator.
- **Service Categories:** Garment manufacturer subtitles with the 7 circular service icons (**T-Shirts, Caps, Hoodies, Jackets, Embroidery, DTF / DTG Printing, Custom Prints**).
- **Invoice Title Bar:** Deep Maroon header with slanted right wedge displaying **Bill No.**, **Date**, and **Due Date**.
- **Bill To & Bill By Boxes:** Side-by-side rounded cards with details (Name, Company, Address, Phone, GSTIN).
- **Meta Cards:** 4 horizontal cards for **Invoice Date**, **Due Date**, **PO No.**, and **Reference**.
- **Products & Items Table:** Maroon header with **S. No.**, **Description**, **Pieces**, **Rate (₹)**, and **Amount (₹)**.
- **Payment Details & QR:** UPI / PhonePe badge with scannable QR code, payment instructions, payment status badge, and balance due summary.
- **Totals Section:** Sub Total, Discount, GST (auto-calculated), and bold maroon **Total Amount** banner.
- **Thank You & Signature:** Handwritten calligraphy *"Thank You! FOR YOUR TRUST"* and an authorized signatory container.
- **Pre-Footer Banner:** *"CUSTOM APPAREL FOR YOUR BRAND & BUSINESS"* with service icons.
- **Footer:** Dark Navy / Black strip with address, phone, Instagram, GSTIN, and website, followed by the maroon tagline bar (`GARMENTS | PRINTING | CUSTOMIZATION`).

---

### 2. ✏️ 100% Inline WYSIWYG Editable
- **Click any text anywhere on the invoice** to edit it directly in place.
- Instant auto-save to browser `localStorage` so your edits and drafts are never lost when you reload the page.

---

### 3. ➕ Dynamic Items & Quick Product Presets
- Click **"+ Add Item Line"** to add unlimited products dynamically.
- Click the **trash icon** on hover to delete any row.
- **Quick Product Buttons** in the sidebar: Add popular products (*Kalma Cap, Rahat Cap, Sabr Cap, Black T-Shirt, Custom DTF Hoodie, Varsity Jacket*) with one click.
- Automatic row renumbering (S. No. 1, 2, 3...).

---

### 4. 🧮 Automatic Real-Time Calculations
- **Row Total:** Automatically calculates `Pieces × Rate = Amount`.
- **Sub Total:** Sum of all row totals.
- **Discount:** Supports both **Flat (₹)** and **Percentage (%)** discounts.
- **GST Calculation:** Select from preset rates (`0%`, `5%`, `12%`, `18%`, `28%`, or Custom `%`).
- **Grand Total:** Automatically updates instantly.
- **Paid & Due Amount:** Computes balance due and automatically changes the **Payment Status** (`UNPAID` / `PARTIALLY PAID` / `PAID`).

---

### 5. 📤 Uploads & Integrations
- **Company Logo:** Upload custom company logo image or reset to the original Xenmark monogram with 1 click.
- **Payment QR Code:** 
  - Upload your own custom QR code image, **OR**
  - Use the built-in **Auto UPI QR Generator** (`upi://pay?pa=...&pn=...&am=...`) which dynamically encodes your UPI ID and automatically links the invoice grand total for instant scanning with GPay, PhonePe, Paytm, or BHIM.
- **Authorized Signature:**
  - Upload an image file of your signature, **OR**
  - Draw your digital signature directly on screen using the built-in drawing canvas (supports mouse, touch, and stylus).

---

### 6. 🎨 Themes, Typography & Customization
- **Color Themes:**
  - 🍷 Original Burgundy / Maroon (`#681324`)
  - 🔵 Royal Navy (`#1e3a8a`)
  - 🟢 Forest Emerald (`#065f46`)
  - ⚫ Classic Onyx (`#18181b`)
  - 🟣 Imperial Purple (`#581c87`)
  - 🟠 Terracotta Amber (`#9a3412`)
  - 🎨 **Custom Color Picker:** Choose any hex color you want!
- **Typography:** Outfit, Inter, Poppins, Montserrat, Roboto, Playfair Display.
- **Currency Support:** ₹ INR, $ USD, € EUR, £ GBP, AED.
- **Template Styles:** Exact Xenmark Garments, Modern Rounded, Minimal Monochrome, Corporate Slate.

---

### 7. 💾 Export & Download Options
- 📄 **Download as PDF:** High-resolution A4 vector document formatted for printing.
- 🖼️ **Download as PNG:** Ultra HD transparent / crisp image (2.5x scale).
- 🖼️ **Download as JPG:** High-quality photo format (95% JPEG quality).
- 🖨️ **Print Invoice:** Optimized `@media print` styles with zero page cutoffs or unwanted controls.

---

## 🚀 How to Run

Simply open `index.html` in any web browser (Google Chrome, Microsoft Edge, Firefox, Brave, Safari):

- Double-click `index.html` in File Explorer, or
- Right-click `index.html` and choose **Open With > Google Chrome**.

