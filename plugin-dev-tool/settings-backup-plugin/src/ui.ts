/**
 * UI creation for Settings Backup plugin
 */

interface UICallbacks {
    onExport: () => void;
    onImport: () => void;
}

let container: HTMLElement | null = null;

export function createUI(callbacks: UICallbacks) {
    // Create container
    container = document.createElement('div');
    container.id = 'settings-backup-ui';
    container.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Export button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '💾 Export Settings';
    exportBtn.style.cssText = `
        padding: 12px 20px;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    `;
    exportBtn.onmouseenter = () => {
        exportBtn.style.background = '#059669';
        exportBtn.style.transform = 'translateY(-2px)';
        exportBtn.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
    };
    exportBtn.onmouseleave = () => {
        exportBtn.style.background = '#10b981';
        exportBtn.style.transform = 'translateY(0)';
        exportBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    };
    exportBtn.onclick = callbacks.onExport;

    // Import button
    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 Import Settings';
    importBtn.style.cssText = `
        padding: 12px 20px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.2s;
    `;
    importBtn.onmouseenter = () => {
        importBtn.style.background = '#2563eb';
        importBtn.style.transform = 'translateY(-2px)';
        importBtn.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
    };
    importBtn.onmouseleave = () => {
        importBtn.style.background = '#3b82f6';
        importBtn.style.transform = 'translateY(0)';
        importBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    };
    importBtn.onclick = callbacks.onImport;

    // Add buttons to container
    container.appendChild(exportBtn);
    container.appendChild(importBtn);

    // Add to page
    document.body.appendChild(container);

    console.log('Settings Backup: UI created');

    // Register cleanup
    onUnload(cleanupUI);
}

function cleanupUI() {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
        container = null;
        console.log('Settings Backup: UI cleaned up');
    }
}
