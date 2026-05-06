// ai.js — AI Modals: Quick Insert and Scan Receipt
// Each modal has completely isolated errors.

// ── QUICK INSERT ──────────────────────────────────────────────────────────────

function openQuickInsertModal() {
    // Close the other AI modal if open
    document.getElementById("ai-scan-receipt-modal").classList.remove("visible");
    document.getElementById("ai-scan-receipt-modal").style.display = "none";

    var modal = document.getElementById("ai-quick-insert-modal");
    modal.style.display = "flex";
    modal.classList.add("visible");
    document.getElementById("quick-insert-text").focus();
}

function closeQuickInsertModal() {
    var modal = document.getElementById("ai-quick-insert-modal");
    modal.style.display = "none";
    modal.classList.remove("visible");
}

async function runQuickInsert() {
    const input   = document.getElementById("quick-insert-text");
    const text    = input.value.trim();
    const btn     = document.getElementById("btn-quick-insert");
    const loading = document.getElementById("quick-insert-loading");
    const errorDiv = document.getElementById("quick-insert-error"); // ISOLATED error

    if (!text) return;

    // Prompt length validation
    if (text.length > 256) {
        errorDiv.innerText = "Il messaggio è troppo lungo (max 256 caratteri).";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    btn.disabled = true;
    loading.style.display = "flex";

    // Change spin speed
    const face = document.getElementById("quick-insert-face");
    if (face) { face.classList.remove("slow"); face.classList.add("fast"); }

    try {
        const result = await apiQuickInsert(text);

        // Close AI modal and open pre-populated transaction modal
        closeQuickInsertModal();
        openTransactionModal("add", {
            type:        result.type,
            amount:      result.amount,
            date:        result.date ? result.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category_id: result.category_id,
            account_id:  result.account_id,
            description: result.description
        });

        input.value = "";
    } catch (err) {
        errorDiv.innerText = "Errore AI: " + err.message;
        errorDiv.style.display = "block";
    } finally {
        btn.disabled = false;
        loading.style.display = "none";
        if (face) { face.classList.remove("fast"); face.classList.add("slow"); }
    }
}

// ── SCAN RECEIPT ──────────────────────────────────────────────────────────────

function openScanReceiptModal() {
    // Close the other AI modal if open
    document.getElementById("ai-quick-insert-modal").classList.remove("visible");
    document.getElementById("ai-quick-insert-modal").style.display = "none";

    var modal = document.getElementById("ai-scan-receipt-modal");
    modal.style.display = "flex";
    modal.classList.add("visible");
}

function closeScanReceiptModal() {
    var modal = document.getElementById("ai-scan-receipt-modal");
    modal.style.display = "none";
    modal.classList.remove("visible");
}

// Helper function to compress images before upload (especially for mobile cameras)
async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(blob => {
                    resolve(new File([blob], "receipt.jpg", { type: "image/jpeg" }));
                }, 'image/jpeg', quality);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

async function runScanReceipt() {
    const fileInput = document.getElementById("receipt-file");
    const btn       = document.getElementById("btn-scan-receipt");
    const loading   = document.getElementById("scan-receipt-loading");
    const errorDiv  = document.getElementById("scan-receipt-error"); // ISOLATED error

    if (!fileInput.files || fileInput.files.length === 0) {
        errorDiv.innerText = "Seleziona prima un'immagine.";
        errorDiv.style.display = "block";
        return;
    }

    errorDiv.style.display = "none";
    btn.disabled = true;
    loading.style.display = "flex";

    // Change spin speed
    const face = document.getElementById("scan-receipt-face");
    if (face) { face.classList.remove("slow"); face.classList.add("fast"); }

    try {
        const originalFile = fileInput.files[0];
        let fileToUpload = originalFile;
        
        try {
            // Compress if it's an image
            if (originalFile.type.startsWith('image/')) {
                fileToUpload = await compressImage(originalFile);
            }
        } catch (e) {
            console.warn("Compression failed, using original file", e);
        }

        const result = await apiScanReceipt(fileToUpload);

        // Close AI modal and open pre-populated transaction modal
        closeScanReceiptModal();
        openTransactionModal("add", {
            type:        result.type || "expense",
            amount:      result.amount,
            date:        result.date ? result.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
            category_id: result.category_id,
            account_id:  result.account_id,
            description: result.description || "Scansione ricevuta"
        });

        fileInput.value = ""; // reset file input
    } catch (err) {
        errorDiv.innerText = "Errore scansione: " + err.message;
        errorDiv.style.display = "block";
    } finally {
        btn.disabled = false;
        loading.style.display = "none";
        if (face) { face.classList.remove("fast"); face.classList.add("slow"); }
    }
}

// ── QUICK INSERT CHAR COUNTER ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
    var aiText = document.getElementById("quick-insert-text");
    if (aiText) {
        aiText.addEventListener("input", function () {
            var count = document.getElementById("ai-char-count");
            if (count) count.textContent = aiText.value.length;
        });
    }
});
