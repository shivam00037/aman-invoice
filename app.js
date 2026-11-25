/**
 * Professional Invoice Builder - Xenmark Garments Edition
 * 1:1 Pixel-Perfect Replica Matching Image 1
 */

(function () {
  'use strict';

  // Application State
  const state = {
    currency: '₹',
    gstRate: 0,
    customGstRate: 0,
    discount: 0,
    discountType: 'amount',
    paidAmount: 0,
    paymentStatus: 'UNPAID',
    zoomLevel: 1.0,
    theme: 'burgundy',
    customColor: '#600c1e',
    font: "'Inter', -apple-system, sans-serif",
    pageMode: 'single', // 'single' (1 page auto-fit) or 'multi' (standard 2 pages)
    upiVpa: '6387731661@paytm',
    upiName: 'XENMARK',
    customLogo: null,
    customQr: null,
    signatureImg: null,
    // Exact sample products from Reference Image 1
    items: [
      { name: 'KALMA CAP (BLACK)', qty: 6, rate: 150.00 },
      { name: 'RAHAT CAP', qty: 2, rate: 120.00 },
      { name: 'SABR CAP', qty: 4, rate: 120.00 },
      { name: 'BLACK TSHIRT', qty: 1, rate: 240.00 }
    ]
  };

  // Canvas context for signature drawing
  let sigCanvas = null;
  let sigCtx = null;
  let isDrawingSig = false;
  let lastX = 0;
  let lastY = 0;

  // DOM Query Helpers
  const getEl = (id) => document.getElementById(id);
  const getTableBody = () => document.getElementById('itemsTableBody');

  /* ==========================================================================
     INITIALIZATION
     ========================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initSignaturePad();
    loadSavedState();
    renderAllItems();
    calculateAll();
    setupGlobalEvents();
    generateDynamicUPIQRCode();
    updatePageModeView();
  });

  /* ==========================================================================
     IMAGE RESIZING & COMPRESSION HELPER
     ========================================================================== */
  function compressAndResizeImage(file, maxDimension, quality, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png', quality);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ==========================================================================
     GLOBAL EVENT LISTENERS
     ========================================================================== */
  function setupGlobalEvents() {
    // Top Bar Actions
    getEl('btnToggleSidebar').addEventListener('click', toggleSidebar);
    getEl('btnCloseSidebar').addEventListener('click', toggleSidebar);
    getEl('btnResetData').addEventListener('click', resetToOriginalSample);
    getEl('btnPrintInvoice').addEventListener('click', () => window.print());

    // Page Mode Switching (Top Header Pills)
    getEl('btnMode1Page').addEventListener('click', () => setPageMode('single'));
    getEl('btnMode2Page').addEventListener('click', () => setPageMode('multi'));

    // Sidebar Page Mode Radio Cards
    document.querySelectorAll('input[name="pageFitOption"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        setPageMode(e.target.value);
      });
    });

    // Overflow Notice Banner Actions
    getEl('btnBannerFit1Page').addEventListener('click', () => setPageMode('single'));
    getEl('btnBannerFit2Page').addEventListener('click', () => setPageMode('multi'));

    // Export Dropdown
    const dropdownWrap = getEl('dropdownWrap');
    getEl('btnDownloadMenu').addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownWrap.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#dropdownWrap')) {
        dropdownWrap.classList.remove('active');
      }
    });

    // Export buttons
    getEl('btnExportPDF').addEventListener('click', exportToPDF);
    getEl('btnExportPNG').addEventListener('click', () => exportToImage('png'));
    getEl('btnExportJPG').addEventListener('click', () => exportToImage('jpeg'));

    // Zoom Controls
    getEl('btnZoomIn').addEventListener('click', () => adjustZoom(0.1));
    getEl('btnZoomOut').addEventListener('click', () => adjustZoom(-0.1));
    getEl('btnZoomFit').addEventListener('click', () => resetZoom());

    // ------------------------------------------------------------------------
    // TABLE: ADD, DELETE & EDIT ITEMS
    // ------------------------------------------------------------------------
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btnAddItemRow')) {
        addItemRow('NEW APPAREL ITEM', 1, 100.00);
        showToast('New item line added', 'success');
      }
    });

    getEl('btnQuickAddItem').addEventListener('click', () => {
      const name = getEl('quickItemName').value.trim() || 'CUSTOM APPAREL';
      const qty = parseFloat(getEl('quickItemQty').value) || 1;
      const rate = parseFloat(getEl('quickItemRate').value) || 0;
      addItemRow(name, qty, rate);
      showToast(`Added ${name} to invoice`, 'success');
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const rate = parseFloat(btn.getAttribute('data-rate')) || 0;
        const qty = parseFloat(btn.getAttribute('data-qty')) || 1;
        addItemRow(name, qty, rate);
        showToast(`Added ${name}`, 'success');
      });
    });

    // Table Row Actions (Delete, Duplicate)
    getTableBody().addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.row-btn-delete');
      if (deleteBtn) {
        const row = deleteBtn.closest('.item-row');
        const allRows = getTableBody().querySelectorAll('.item-row');
        if (allRows.length <= 1) {
          showToast('Invoice must have at least one product row', 'error');
          return;
        }
        row.remove();
        calculateAll();
        showToast('Item deleted', 'info');
        return;
      }

      const dupBtn = e.target.closest('.row-btn-duplicate');
      if (dupBtn) {
        const row = dupBtn.closest('.item-row');
        const name = row.querySelector('.item-name').textContent.trim();
        const qty = parseFloat(row.querySelector('.qty-input').value) || 1;
        const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
        const gstRate = parseFloat(row.querySelector('.gst-input').value) || 0;
        addItemRow(name, qty, rate, gstRate);
        showToast(`Duplicated ${name}`, 'success');
      }
    });

    // Live calculation on quantity or rate input
    getTableBody().addEventListener('input', (e) => {
      if (e.target.classList.contains('qty-input') || e.target.classList.contains('rate-input') || e.target.classList.contains('gst-input')) {
        calculateAll();
      }
    });

    // ------------------------------------------------------------------------
    // UPLOADS: LOGO
    // ------------------------------------------------------------------------
    const logoInput = getEl('logoFileInput');
    getEl('btnSidebarUploadLogo').addEventListener('click', () => logoInput.click());
    getEl('logoWrapper').addEventListener('click', (e) => {
      if (!e.target.isContentEditable) {
        logoInput.click();
      }
    });
    getEl('btnResetLogo').addEventListener('click', resetLogoToDefault);

    logoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      compressAndResizeImage(file, 600, 0.9, (dataUrl) => {
        setCompanyLogo(dataUrl);
        showToast('Company logo updated successfully', 'success');
      });
      logoInput.value = '';
    });

    // ------------------------------------------------------------------------
    // UPLOADS: QR CODE & UPI GENERATOR
    // ------------------------------------------------------------------------
    const qrInput = getEl('qrFileInput');
    getEl('btnSidebarUploadQR').addEventListener('click', () => qrInput.click());
    getEl('qrContainer').addEventListener('click', () => openQrModal());
    getEl('btnOpenQRGenerator').addEventListener('click', () => openQrModal());

    qrInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      compressAndResizeImage(file, 400, 0.9, (dataUrl) => {
        setCustomQrImage(dataUrl);
        showToast('Custom QR code applied', 'success');
      });
      qrInput.value = '';
    });

    // QR Modal controls
    getEl('btnCloseQrModal').addEventListener('click', closeQrModal);
    getEl('btnCancelQrModal').addEventListener('click', closeQrModal);
    getEl('btnApplyUpiQr').addEventListener('click', applyUpiQrFromModal);
    getEl('upiIdInput').addEventListener('input', refreshModalQrPreview);
    getEl('upiNameInput').addEventListener('input', refreshModalQrPreview);
    getEl('upiIncludeAmount').addEventListener('change', refreshModalQrPreview);

    // ------------------------------------------------------------------------
    // UPLOADS: SIGNATURE & SIGNATURE PAD
    // ------------------------------------------------------------------------
    const sigInput = getEl('sigFileInput');
    getEl('btnSidebarUploadSig').addEventListener('click', () => sigInput.click());
    getEl('btnOpenSigModal').addEventListener('click', openSigModal);
    getEl('sigPreviewWrapper').addEventListener('click', openSigModal);
    getEl('btnClearSignatureSidebar').addEventListener('click', clearSignature);

    sigInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      compressAndResizeImage(file, 500, 0.9, (dataUrl) => {
        setSignatureImage(dataUrl);
        showToast('Signature image uploaded', 'success');
      });
      sigInput.value = '';
    });

    // Signature Modal controls
    getEl('btnCloseSigModal').addEventListener('click', closeSigModal);
    getEl('btnClearSignature').addEventListener('click', clearSigCanvas);
    getEl('btnSaveSignature').addEventListener('click', applyDrawnSignature);

    // ------------------------------------------------------------------------
    // SIDEBAR: TAXES, DISCOUNTS & STATUS
    // ------------------------------------------------------------------------
    getEl('gstRateSelect').addEventListener('change', (e) => {
      state.gstRate = e.target.value;
      if (state.gstRate === 'custom') {
        getEl('customGstInput').style.display = 'block';
        state.customGstRate = parseFloat(getEl('customGstInput').value) || 0;
      } else {
        getEl('customGstInput').style.display = 'none';
        state.customGstRate = 0;
      }
      calculateAll();
    });

    getEl('customGstInput').addEventListener('input', (e) => {
      state.customGstRate = parseFloat(e.target.value) || 0;
      calculateAll();
    });

    getEl('discountInput').addEventListener('input', (e) => {
      state.discount = parseFloat(e.target.value) || 0;
      calculateAll();
    });

    getEl('discountTypeSelect').addEventListener('change', (e) => {
      state.discountType = e.target.value;
      calculateAll();
    });

    getEl('paidAmountInput').addEventListener('input', (e) => {
      state.paidAmount = parseFloat(e.target.value) || 0;
      calculateAll();
    });

    getEl('paymentStatusSelect').addEventListener('change', (e) => {
      state.paymentStatus = e.target.value;
      updatePaymentStatusBadge();
      saveState();
    });

    // ------------------------------------------------------------------------
    // SIDEBAR: STYLES, THEMES & FONTS
    // ------------------------------------------------------------------------
    document.querySelectorAll('.theme-swatches .swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.theme-swatches .swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        applyTheme(swatch.getAttribute('data-theme'));
      });
    });

    getEl('customColorInput').addEventListener('input', (e) => {
      document.querySelectorAll('.theme-swatches .swatch').forEach(s => s.classList.remove('active'));
      applyCustomColor(e.target.value);
    });

    getEl('fontSelect').addEventListener('change', (e) => {
      state.font = e.target.value;
      getEl('invoicePaper').style.fontFamily = state.font;
      saveState();
    });

    document.querySelectorAll('.currency-pills .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.currency-pills .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currency = pill.getAttribute('data-currency');
        updateCurrencyLabels();
        calculateAll();
      });
    });

    // Auto-save on blur
    getEl('invoicePaper').addEventListener('blur', (e) => {
      if (e.target.isContentEditable) {
        saveState();
      }
    }, true);
  }

  /* ==========================================================================
     PAGE MODE MANAGEMENT (1-PAGE FIT vs MULTI-PAGE)
     ========================================================================== */
  function setPageMode(mode) {
    state.pageMode = mode;
    updatePageModeView();
    saveState();
    showToast(mode === 'single' ? 'Layout mode set to: 1-Page (Compact Fit)' : 'Layout mode set to: 2-Pages (Standard)', 'info');
  }

  function updatePageModeView() {
    const isSingle = state.pageMode === 'single';
    const paper = getEl('invoicePaper');
    const badge = getEl('pageFitBadge');
    const note = getEl('pdfModeNote');

    // Update Header Pills
    getEl('btnMode1Page').classList.toggle('active', isSingle);
    getEl('btnMode2Page').classList.toggle('active', !isSingle);

    // Update Sidebar Radio Cards
    const cardSingle = getEl('cardFitSingle');
    const cardMulti = getEl('cardFitMulti');
    if (cardSingle && cardMulti) {
      cardSingle.classList.toggle('active', isSingle);
      cardMulti.classList.toggle('active', !isSingle);
      cardSingle.querySelector('input').checked = isSingle;
      cardMulti.querySelector('input').checked = !isSingle;
    }

    if (isSingle) {
      badge.className = 'page-fit-indicator';
      badge.innerHTML = '<i class="fa-solid fa-file"></i> 1 Page Fit';
      if (note) note.textContent = 'Exact 1:1 single A4 vector document';

      if (state.items.length >= 5) {
        paper.classList.add('compact-mode');
      } else {
        paper.classList.remove('compact-mode');
      }
    } else {
      badge.className = 'page-fit-indicator multi';
      badge.innerHTML = '<i class="fa-solid fa-copy"></i> Multi-Page';
      if (note) note.textContent = 'Standard multi-page document';
      paper.classList.remove('compact-mode');
    }

    // Check if notification banner should be shown
    const notice = getEl('itemCountNotice');
    if (notice) {
      if (state.items.length >= 6) {
        notice.style.display = 'flex';
        getEl('itemCountDisplay').textContent = state.items.length;
      } else {
        notice.style.display = 'none';
      }
    }
  }

  /* ==========================================================================
     TABLE MANAGEMENT (ADD, RENDER, DELETE)
     ========================================================================== */
  function renderAllItems() {
    const tbody = getTableBody();
    tbody.innerHTML = '';
    state.items.forEach(item => {
      appendItemRowToDOM(item.name, item.qty, item.rate, item.gstRate ?? 0);
    });
  }

  function addItemRow(name = 'NEW APPAREL ITEM', qty = 1, rate = 100.00, gstRate = 0) {
    appendItemRowToDOM(name, qty, rate, gstRate);
    calculateAll();
    updatePageModeView();

    const lastRow = getTableBody().lastElementChild;
    if (lastRow) {
      const desc = lastRow.querySelector('.item-name');
      if (desc) desc.focus();
    }
  }

  function appendItemRowToDOM(name, qty, rate, gstRate = 0) {
    const tbody = getTableBody();
    const tr = document.createElement('tr');
    tr.className = 'item-row';
    const amount = (parseFloat(qty) || 0) * (parseFloat(rate) || 0);
    const totalWithGst = amount * (1 + (parseFloat(gstRate) || 0) / 100);

    tr.innerHTML = `
      <td class="col-sno text-center"><span class="row-sno"></span></td>
      <td class="col-desc">
        <div class="item-name" contenteditable="true" spellcheck="false">${escapeHTML(name)}</div>
      </td>
      <td class="col-qty text-center">
        <input type="number" class="qty-input" value="${qty}" min="1" step="any">
      </td>
      <td class="col-rate text-center">
        <div class="rate-wrap">
          <span class="currency-label">${state.currency}</span>
          <input type="number" class="rate-input" value="${Number(rate).toFixed(2)}" min="0" step="any">
        </div>
      </td>
      <td class="col-gst text-center">
        <input type="number" class="gst-input" value="${Number(gstRate) || 0}" min="0" max="100" step="any" aria-label="GST percentage">
      </td>
      <td class="col-amount text-right">
        <span class="currency-label">${state.currency}</span>
        <span class="row-amount-text">${formatMoney(amount)}</span>
      </td>
      <td class="col-total-gst text-right">
        <span class="currency-label">${state.currency}</span>
        <span class="row-total-gst-text">${formatMoney(totalWithGst)}</span>
      </td>
      <td class="col-actions text-center no-print">
        <div class="row-actions-group">
          <button class="row-btn-action row-btn-duplicate" title="Duplicate Row"><i class="fa-regular fa-copy"></i></button>
          <button class="row-btn-action row-btn-delete" title="Delete Row"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  }

  /* ==========================================================================
     CALCULATIONS & FORMATTING
     ========================================================================== */
  function formatMoney(amount) {
    const num = isNaN(amount) ? 0 : Number(amount);
    return num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function calculateAll() {
    let subtotal = 0;
    let gstAmount = 0;
    const rows = getTableBody().querySelectorAll('.item-row');
    const updatedItems = [];

    rows.forEach((row, index) => {
      const sno = row.querySelector('.row-sno');
      if (sno) sno.textContent = index + 1;

      const name = row.querySelector('.item-name')?.textContent.trim() || 'ITEM';
      const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;
      const rate = parseFloat(row.querySelector('.rate-input')?.value) || 0;
      const gstRate = Math.max(0, parseFloat(row.querySelector('.gst-input')?.value) || 0);
      const rowTotal = qty * rate;
      const rowGst = rowTotal * gstRate / 100;
      const totalWithGst = rowTotal + rowGst;

      row.querySelector('.row-amount-text').textContent = formatMoney(rowTotal);
      row.querySelector('.row-total-gst-text').textContent = formatMoney(totalWithGst);
      subtotal += rowTotal;
      gstAmount += rowGst;
      updatedItems.push({ name, qty, rate, gstRate });
    });

    state.items = updatedItems;

    let discountVal = state.discountType === 'percent'
      ? subtotal * state.discount / 100
      : state.discount;
    discountVal = Math.min(Math.max(0, discountVal), subtotal);

    // Apply the discount proportionally across products before calculating GST.
    const discountRatio = subtotal > 0 ? (subtotal - discountVal) / subtotal : 0;
    gstAmount *= discountRatio;
    const taxableAmount = Math.max(0, subtotal - discountVal);
    const grandTotal = taxableAmount + gstAmount;
    const dueAmount = Math.max(0, grandTotal - state.paidAmount);

    if (grandTotal > 0 && dueAmount === 0) {
      state.paymentStatus = 'PAID';
      getEl('paymentStatusSelect').value = 'PAID';
    } else if (state.paidAmount > 0 && dueAmount > 0) {
      state.paymentStatus = 'PARTIALLY PAID';
      getEl('paymentStatusSelect').value = 'PARTIALLY PAID';
    }

    getEl('displaySubTotal').textContent = formatMoney(subtotal);
    getEl('displayDiscount').textContent = formatMoney(discountVal);
    getEl('displayGstRate').textContent = 'Varies';
    getEl('displayGstAmount').textContent = formatMoney(gstAmount);
    getEl('displayGrandTotal').textContent = formatMoney(grandTotal);
    getEl('displayAmountPaid').textContent = formatMoney(state.paidAmount);
    getEl('displayDueAmount').textContent = formatMoney(dueAmount);
    getEl('modalGrandTotal').textContent = formatMoney(grandTotal);

    updatePaymentStatusBadge();
    if (!state.customQr) generateDynamicUPIQRCode(grandTotal);
    saveState();
  }

  function updatePaymentStatusBadge() {
    getEl('statusTextValue').textContent = state.paymentStatus;
    if (state.paymentStatus === 'PAID') {
      getEl('paymentStatusDisplay').className = 'payment-status-badge status-paid';
    } else {
      getEl('paymentStatusDisplay').className = 'payment-status-badge status-unpaid';
    }
  }

  function updateCurrencyLabels() {
    document.querySelectorAll('.currency-label').forEach(el => {
      el.textContent = state.currency;
    });
  }

  /* ==========================================================================
     LOGO HANDLING
     ========================================================================== */
  function setCompanyLogo(dataUrl) {
    state.customLogo = dataUrl;
    const customImg = getEl('customUploadedLogoImg');
    const defaultSvg = getEl('defaultXenmarkLogo');
    customImg.src = dataUrl;
    customImg.style.display = 'block';
    defaultSvg.style.display = 'none';
    saveState();
  }

  function resetLogoToDefault() {
    state.customLogo = null;
    const customImg = getEl('customUploadedLogoImg');
    const defaultSvg = getEl('defaultXenmarkLogo');
    customImg.style.display = 'none';
    defaultSvg.style.display = 'flex';
    showToast('Reset to default Xenmark monogram', 'success');
    saveState();
  }

  /* ==========================================================================
     QR CODE HANDLING (DYNAMIC UPI & UPLOAD)
     ========================================================================== */
  function setCustomQrImage(dataUrl) {
    state.customQr = dataUrl;
    const customImg = getEl('customQrImage');
    const dynamicCanvas = getEl('dynamicQrCanvas');
    customImg.src = dataUrl;
    customImg.style.display = 'block';
    dynamicCanvas.style.display = 'none';
    saveState();
  }

  function generateDynamicUPIQRCode(amount = null) {
    if (state.customQr) return;

    const dynamicContainer = getEl('dynamicQrCanvas');
    const customImg = getEl('customQrImage');
    dynamicContainer.style.display = 'block';
    customImg.style.display = 'none';
    dynamicContainer.innerHTML = '';

    const upiId = state.upiVpa || '6387731661@paytm';
    const upiName = encodeURIComponent(state.upiName || 'XENMARK');
    let upiUrl = `upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`;
    if (amount !== null && amount > 0) {
      upiUrl += `&am=${amount.toFixed(2)}`;
    }

    try {
      if (typeof QRCode !== 'undefined') {
        const qrSize = getEl('invoicePaper').classList.contains('compact-mode') ? 78 : 106;
        new QRCode(dynamicContainer, {
          text: upiUrl,
          width: qrSize,
          height: qrSize,
          colorDark: '#0c1017',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    } catch (err) {
      console.warn('QR code generation warning:', err);
    }
  }

  function openQrModal() {
    getEl('qrModal').classList.add('active');
    refreshModalQrPreview();
  }

  function closeQrModal() {
    getEl('qrModal').classList.remove('active');
  }

  function refreshModalQrPreview() {
    const preview = getEl('modalQrPreview');
    preview.innerHTML = '';
    const upiId = getEl('upiIdInput').value.trim() || '6387731661@paytm';
    const upiName = encodeURIComponent(getEl('upiNameInput').value.trim() || 'XENMARK');
    let upiUrl = `upi://pay?pa=${upiId}&pn=${upiName}&cu=INR`;

    if (getEl('upiIncludeAmount').checked) {
      const grandTotalNum = parseFloat(getEl('displayGrandTotal').textContent.replace(/,/g, '')) || 0;
      if (grandTotalNum > 0) {
        upiUrl += `&am=${grandTotalNum.toFixed(2)}`;
      }
    }

    try {
      if (typeof QRCode !== 'undefined') {
        new QRCode(preview, {
          text: upiUrl,
          width: 130,
          height: 130,
          colorDark: '#0c1017',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      }
    } catch (err) {}
  }

  function applyUpiQrFromModal() {
    state.upiVpa = getEl('upiIdInput').value.trim();
    state.upiName = getEl('upiNameInput').value.trim();
    state.customQr = null;
    const grandTotalNum = parseFloat(getEl('displayGrandTotal').textContent.replace(/,/g, '')) || 0;
    generateDynamicUPIQRCode(getEl('upiIncludeAmount').checked ? grandTotalNum : null);
    closeQrModal();
    showToast('Dynamic UPI QR applied', 'success');
    saveState();
  }

  /* ==========================================================================
     SIGNATURE HANDLING (DRAW & UPLOAD)
     ========================================================================== */
  function initSignaturePad() {
    sigCanvas = getEl('signatureCanvas');
    if (!sigCanvas) return;
    sigCtx = sigCanvas.getContext('2d');
    sigCtx.lineWidth = 2.5;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    sigCtx.strokeStyle = '#1e293b';

    sigCanvas.addEventListener('mousedown', (e) => {
      isDrawingSig = true;
      const rect = sigCanvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    });

    sigCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawingSig) return;
      const rect = sigCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      sigCtx.beginPath();
      sigCtx.moveTo(lastX, lastY);
      sigCtx.lineTo(x, y);
      sigCtx.stroke();
      lastX = x;
      lastY = y;
    });

    window.addEventListener('mouseup', () => { isDrawingSig = false; });

    sigCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = sigCanvas.getBoundingClientRect();
      lastX = touch.clientX - rect.left;
      lastY = touch.clientY - rect.top;
      isDrawingSig = true;
    }, { passive: false });

    sigCanvas.addEventListener('touchmove', (e) => {
      if (!isDrawingSig) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = sigCanvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      sigCtx.beginPath();
      sigCtx.moveTo(lastX, lastY);
      sigCtx.lineTo(x, y);
      sigCtx.stroke();
      lastX = x;
      lastY = y;
    }, { passive: false });

    sigCanvas.addEventListener('touchend', () => { isDrawingSig = false; });
  }

  function setSignatureImage(dataUrl) {
    state.signatureImg = dataUrl;
    const sigImg = getEl('sigImage');
    const placeholder = getEl('sigPlaceholder');
    sigImg.src = dataUrl;
    sigImg.style.display = 'block';
    placeholder.style.display = 'none';
    getEl('signatureContainer').style.display = 'flex';
    saveState();
  }

  function clearSignature() {
    state.signatureImg = null;
    const sigImg = getEl('sigImage');
    const placeholder = getEl('sigPlaceholder');
    sigImg.style.display = 'none';
    placeholder.style.display = 'flex';
    getEl('signatureContainer').style.display = 'none';
    showToast('Signature removed', 'info');
    saveState();
  }

  function openSigModal() {
    getEl('sigModal').classList.add('active');
    clearSigCanvas();
  }

  function closeSigModal() {
    getEl('sigModal').classList.remove('active');
  }

  function clearSigCanvas() {
    if (sigCtx) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
    }
  }

  function applyDrawnSignature() {
    const dataUrl = sigCanvas.toDataURL('image/png');
    setSignatureImage(dataUrl);
    closeSigModal();
    showToast('Digital signature applied', 'success');
  }

  /* ==========================================================================
     THEMING & CUSTOMIZATION
     ========================================================================== */
  function applyTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    state.theme = themeName;
    saveState();
  }

  function applyCustomColor(colorHex) {
    document.documentElement.style.setProperty('--primary-color', colorHex);
    document.documentElement.style.setProperty('--primary-dark', adjustBrightness(colorHex, -30));
    document.documentElement.style.setProperty('--primary-light', adjustBrightness(colorHex, 20));
    document.documentElement.style.setProperty('--primary-subtle', colorHex + '15');
    state.theme = 'custom';
    state.customColor = colorHex;
    saveState();
  }

  function adjustBrightness(col, percent) {
    let num = parseInt(col.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /* ==========================================================================
     EXPORTS: 100% IDENTICAL PDF (EXACT CROPPED A4 FIT WITH ZERO VOIDS)
     ========================================================================== */
  async function exportToPDF() {
    showToast('Generating exact 1:1 PDF...', 'info');
    getEl('dropdownWrap').classList.remove('active');

    const paper = getEl('invoicePaper');
    const prevTransform = getEl('invoiceContainerOuter').style.transform;
    getEl('invoiceContainerOuter').style.transform = 'none';

    if (document.fonts) {
      await document.fonts.ready;
    }

    try {
      const canvas = await html2canvas(paper, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedPaper = clonedDoc.getElementById('invoicePaper');
          if (clonedPaper) {
            // Replace input fields with static text so no gray borders or shifts appear
            clonedPaper.querySelectorAll('.qty-input').forEach(input => {
              const span = clonedDoc.createElement('span');
              span.textContent = input.value;
              span.style.fontWeight = '700';
              span.style.textAlign = 'center';
              span.style.display = 'inline-block';
              input.parentNode.replaceChild(span, input);
            });

            clonedPaper.querySelectorAll('.rate-input').forEach(input => {
              const span = clonedDoc.createElement('span');
              span.textContent = Number(input.value || 0).toFixed(2);
              span.style.fontWeight = '700';
              span.style.display = 'inline-block';
              input.parentNode.replaceChild(span, input);
            });

            // Strip interactive toolbars from clone
            clonedPaper.querySelectorAll('.no-print, .hover-overlay, .row-actions-group, .table-add-row-bar').forEach(el => el.remove());
          }
        }
      });

      // Restore zoom transform
      getEl('invoiceContainerOuter').style.transform = prevTransform;

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Proportional PDF matching the exact aspect ratio of the invoice
      // Eliminates all bottom blank voids completely (100% 1:1 replica of Image 1)
      const a4Width = 210;
      const pdfHeight = (canvas.height * a4Width) / canvas.width;

      const pdf = new jspdf.jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [a4Width, pdfHeight]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, a4Width, pdfHeight);
      pdf.save(`Invoice_${getInvoiceNumber()}.pdf`);

      showToast('1:1 Exact PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      getEl('invoiceContainerOuter').style.transform = prevTransform;
      showToast('Export failed, opening print view', 'error');
      window.print();
    }
  }

  async function exportToImage(format = 'png') {
    showToast(`Generating ${format.toUpperCase()} image...`, 'info');
    getEl('dropdownWrap').classList.remove('active');

    const paper = getEl('invoicePaper');
    const prevTransform = getEl('invoiceContainerOuter').style.transform;
    getEl('invoiceContainerOuter').style.transform = 'none';

    if (document.fonts) {
      await document.fonts.ready;
    }

    try {
      const canvas = await html2canvas(paper, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedPaper = clonedDoc.getElementById('invoicePaper');
          if (clonedPaper) {
            clonedPaper.querySelectorAll('.qty-input').forEach(input => {
              const span = clonedDoc.createElement('span');
              span.textContent = input.value;
              span.style.fontWeight = '700';
              input.parentNode.replaceChild(span, input);
            });

            clonedPaper.querySelectorAll('.rate-input').forEach(input => {
              const span = clonedDoc.createElement('span');
              span.textContent = Number(input.value || 0).toFixed(2);
              span.style.fontWeight = '700';
              input.parentNode.replaceChild(span, input);
            });

            clonedPaper.querySelectorAll('.no-print, .hover-overlay, .row-actions-group, .table-add-row-bar').forEach(el => el.remove());
          }
        }
      });

      getEl('invoiceContainerOuter').style.transform = prevTransform;

      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const link = document.createElement('a');
      link.download = `Invoice_${getInvoiceNumber()}.${ext}`;
      link.href = canvas.toDataURL(mime, 0.98);
      link.click();

      showToast(`${format.toUpperCase()} downloaded successfully!`, 'success');
    } catch (err) {
      console.error('Image export failed:', err);
      getEl('invoiceContainerOuter').style.transform = prevTransform;
      showToast('Image export failed', 'error');
    }
  }

  function getInvoiceNumber() {
    const el = getEl('docBillNo');
    const text = el ? el.textContent.trim() : '';
    return text ? text.replace(/[^a-zA-Z0-9_-]/g, '_') : 'ARABWEARS_30-10-2025';
  }

  /* ==========================================================================
     ZOOM & VIEWPORT
     ========================================================================== */
  function adjustZoom(delta) {
    state.zoomLevel = Math.max(0.6, Math.min(1.5, state.zoomLevel + delta));
    updateZoom();
  }

  function resetZoom() {
    state.zoomLevel = 1.0;
    updateZoom();
  }

  function updateZoom() {
    getEl('invoiceContainerOuter').style.transform = `scale(${state.zoomLevel})`;
    getEl('zoomLevelText').textContent = `${Math.round(state.zoomLevel * 100)}%`;
  }

  function toggleSidebar() {
    getEl('sidebarPanel').classList.toggle('collapsed');
  }

  /* ==========================================================================
     STATE PERSISTENCE
     ========================================================================== */
  function saveState() {
    try {
      localStorage.setItem('xenmark_inv_state_v5', JSON.stringify(state));
      const status = getEl('saveStatus');
      if (status) {
        status.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Auto-saved</span>';
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  function loadSavedState() {
    try {
      const raw = localStorage.getItem('xenmark_inv_state_v5');
      if (raw) {
        const parsed = JSON.parse(raw);
        Object.assign(state, parsed);

        if (state.customLogo) setCompanyLogo(state.customLogo);
        if (state.customQr) setCustomQrImage(state.customQr);
        if (state.signatureImg) setSignatureImage(state.signatureImg);
        if (state.theme === 'custom') applyCustomColor(state.customColor);
        else applyTheme(state.theme);

        if (state.font) {
          getEl('invoicePaper').style.fontFamily = state.font;
          getEl('fontSelect').value = state.font;
        }

        updateCurrencyLabels();
      }
    } catch (e) {}
  }

  function resetToOriginalSample() {
    if (!confirm('Reset all values to the original sample invoice from the image?')) {
      return;
    }
    try {
      localStorage.clear();
    } catch (e) {}
    location.reload();
  }

  /* ==========================================================================
     TOAST NOTIFICATIONS
     ========================================================================== */
  function showToast(message, type = 'info') {
    const container = getEl('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

})();
