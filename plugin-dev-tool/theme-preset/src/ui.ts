/**
 * UI module for floating window and modal dialogs
 *
 * This is a simplified version. The original plugin has extensive UI features.
 * You can expand this by referencing the original theme-preset-plugin-fix3.js
 */

import { FEEDBACK_TIMEOUT, FOCUS_DELAY } from './constants';
import {
    getPresets,
    saveCurrentTheme,
    loadThemePreset,
    deleteThemePreset,
    renameThemePreset,
    exportThemePreset,
    importThemePreset,
    getCharacterThemeMap,
    addCharacterThemeMapping,
    removeCharacterThemeMapping,
    getDefaultTheme,
    setDefaultTheme
} from './storage';
import { getAutoSwitchEnabled, setAutoSwitchEnabled } from './auto-switch';
import { getShortcut, setShortcut, formatShortcutDisplay } from './shortcuts';
import type { WindowState, ModalOptions } from './types';

// Window state
const windowState: WindowState = {
    window: null,
    overlay: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
};

/**
 * Show a modal dialog
 */
export function showModal(options: any): void {
    const { title, content, buttons = [], input = null } = options;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: var(--risu-theme-darkbg, #1a1a1a);
        border: 2px solid var(--risu-theme-darkborderc, #333);
        border-radius: 12px;
        padding: 24px;
        min-width: 300px;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    `;

    modal.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: var(--risu-theme-textcolor, #fff); font-size: 1.2em; font-weight: 600;">${title}</h3>
        <div style="color: var(--risu-theme-textcolor2, #ccc); margin-bottom: 20px; line-height: 1.5;">${content}</div>
        ${input ? `<input type="text" id="modal-input" value="${input.value || ''}" placeholder="${input.placeholder || ''}" style="
            width: 100%;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid var(--risu-theme-darkborderc, #333);
            background: var(--risu-theme-bgcolor, #2a2a2a);
            color: var(--risu-theme-textcolor, #fff);
            font-size: 0.95em;
            margin-bottom: 16px;
        ">` : ''}
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
        </div>
    `;

    const buttonContainer = modal.querySelector('div:last-child') as HTMLElement;

    buttons.forEach((btn: any) => {
        const button = document.createElement('button');
        button.textContent = btn.text;
        button.style.cssText = `
            padding: 10px 20px;
            border-radius: 6px;
            border: none;
            background: ${btn.primary ? 'var(--risu-theme-selected, #4a9eff)' : 'var(--risu-theme-darkbutton, #444)'};
            color: var(--risu-theme-textcolor, #fff);
            cursor: pointer;
            font-weight: ${btn.primary ? '600' : '500'};
            transition: all 0.2s;
        `;
        button.onmouseover = () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        };
        button.onmouseout = () => {
            button.style.transform = '';
            button.style.boxShadow = '';
        };
        button.onclick = () => {
            const inputEl = modal.querySelector('#modal-input') as HTMLInputElement;
            const inputValue = input ? inputEl?.value : null;
            overlay.remove();
            if (btn.onClick) btn.onClick(inputValue);
        };
        buttonContainer.appendChild(button);
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Focus on input if present
    if (input) {
        const inputEl = modal.querySelector('#modal-input') as HTMLInputElement;
        setTimeout(() => inputEl?.focus(), FOCUS_DELAY);

        // Allow Enter to submit
        inputEl?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const primaryBtn = buttons.find((b: any) => b.primary);
                if (primaryBtn) {
                    overlay.remove();
                    primaryBtn.onClick(inputEl.value);
                }
            }
        });
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Show button success feedback
 */
export function showButtonFeedback(
    button: HTMLButtonElement,
    successText: string,
    originalText?: string,
    successColor = 'var(--draculared, #50fa7b)'
): void {
    const origText = originalText || button.textContent || '';
    const origBg = button.style.background;

    button.textContent = successText;
    button.style.background = successColor;

    setTimeout(() => {
        button.textContent = origText;
        button.style.background = origBg;
    }, FEEDBACK_TIMEOUT);
}

/**
 * Create the floating window UI
 *
 * NOTE: This is a minimal implementation. The original plugin has extensive
 * UI features including character mappings, auto-switch, etc.
 * Refer to theme-preset-plugin-fix3.js for the complete implementation.
 */
export function createFloatingWindow(): HTMLElement {
    if (windowState.window) {
        return windowState.window;
    }

    // Create overlay background
    const overlay = document.createElement('div');
    overlay.id = 'theme-preset-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: none;
    `;
    document.body.appendChild(overlay);
    windowState.overlay = overlay;

    // Create floating window container
    const container = document.createElement('div');
    container.id = 'theme-preset-floating-window';
    container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 500px;
        max-width: 90vw;
        max-height: 80vh;
        background: var(--risu-theme-darkbg, #1a1a1a);
        border: 2px solid var(--risu-theme-darkborderc, #333);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: none;
        flex-direction: column;
        font-family: system-ui, -apple-system, sans-serif;
    `;

    // Simplified UI structure
    container.innerHTML = `
        <div id="preset-window-header" style="
            padding: 15px 20px;
            background: var(--risu-theme-bgcolor, #2a2a2a);
            border-bottom: 1px solid var(--risu-theme-darkborderc, #333);
            border-radius: 10px 10px 0 0;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        ">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2em;">🎨</span>
                <h3 style="margin: 0; color: var(--risu-theme-textcolor, #fff); font-size: 1.1em; font-weight: 600;">Theme Preset Manager</h3>
            </div>
            <button id="close-preset-window" style="
                background: transparent;
                border: none;
                color: var(--risu-theme-textcolor2, #888);
                font-size: 1.5em;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
            ">
                ×
            </button>
        </div>

        <div style="padding: 20px; overflow-y: auto; flex: 1;">
            <!-- Save Preset Section -->
            <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                <input type="text" id="preset-name-input" placeholder="Enter preset name..."
                       style="flex: 1; min-width: 150px; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--risu-theme-darkborderc, #333); background: var(--risu-theme-bgcolor, #2a2a2a); color: var(--risu-theme-textcolor, #fff); font-size: 0.95em;">
                <button id="save-preset-btn" style="
                    padding: 10px 16px;
                    border-radius: 6px;
                    border: none;
                    background: var(--risu-theme-selected, #4a9eff);
                    color: var(--risu-theme-textcolor, #fff);
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 0.95em;
                    transition: all 0.2s;
                ">
                    💾 Save Current
                </button>
            </div>

            <h4 style="color: var(--risu-theme-textcolor, #fff); margin: 20px 0 10px 0;">Saved Presets</h4>
            <div id="preset-list" style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Preset items will be added here dynamically -->
            </div>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--risu-theme-darkborderc, #333);">
                <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.85em; text-align: center;">
                    Press ${formatShortcutDisplay(getShortcut())} to toggle this window
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(container);
    windowState.window = container;

    // Setup event listeners
    setupEventListeners();

    // Initial update
    updatePresetList();

    return container;
}

/**
 * Setup event listeners for the floating window
 */
function setupEventListeners(): void {
    const container = windowState.window;
    if (!container) return;

    // Close button
    const closeBtn = container.querySelector('#close-preset-window');
    closeBtn?.addEventListener('click', () => {
        toggleFloatingWindow();
    });

    // Close on overlay click
    windowState.overlay?.addEventListener('click', () => {
        toggleFloatingWindow();
    });

    // Save preset
    const saveBtn = container.querySelector('#save-preset-btn');
    const nameInput = container.querySelector('#preset-name-input') as HTMLInputElement;

    saveBtn?.addEventListener('click', () => {
        const name = nameInput?.value.trim();
        if (!name) {
            showModal({
                title: '⚠️ Error',
                content: 'Please enter a preset name',
                buttons: [{ text: 'OK', primary: true }]
            });
            return;
        }

        saveCurrentTheme(name);
        nameInput.value = '';
        updatePresetList();
        showButtonFeedback(saveBtn as HTMLButtonElement, '✓ Saved!');
    });

    // Enter to save
    nameInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn?.dispatchEvent(new Event('click'));
        }
    });

    // Dragging functionality
    const header = container.querySelector('#preset-window-header') as HTMLElement;
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header?.addEventListener('mousedown', (e) => {
        isDragging = true;
        const rect = container.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        container.style.transform = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

/**
 * Update the preset list display
 */
function updatePresetList(): void {
    const listContainer = windowState.window?.querySelector('#preset-list');
    if (!listContainer) return;

    const presets = getPresets();
    listContainer.innerHTML = '';

    if (presets.length === 0) {
        listContainer.innerHTML = `
            <div style="color: var(--risu-theme-textcolor2, #888); text-align: center; padding: 20px;">
                No presets saved yet. Save your first preset above!
            </div>
        `;
        return;
    }

    presets.forEach(preset => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: var(--risu-theme-bgcolor, #2a2a2a);
            border: 1px solid var(--risu-theme-darkborderc, #333);
            border-radius: 6px;
            transition: all 0.2s;
        `;

        item.innerHTML = `
            <div style="flex: 1;">
                <div style="color: var(--risu-theme-textcolor, #fff); font-weight: 500;">${escapeHtml(preset.name)}</div>
                <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.85em;">
                    ${new Date(preset.timestamp).toLocaleDateString()}
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button class="load-btn" data-name="${escapeHtml(preset.name)}" style="
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    background: var(--risu-theme-selected, #4a9eff);
                    color: var(--risu-theme-textcolor, #fff);
                    cursor: pointer;
                    font-size: 0.85em;
                    transition: all 0.2s;
                ">Load</button>
                <button class="delete-btn" data-name="${escapeHtml(preset.name)}" style="
                    padding: 6px 12px;
                    border-radius: 4px;
                    border: none;
                    background: var(--risu-theme-darkbutton, #444);
                    color: var(--risu-theme-textcolor, #fff);
                    cursor: pointer;
                    font-size: 0.85em;
                    transition: all 0.2s;
                ">Delete</button>
            </div>
        `;

        // Load button
        const loadBtn = item.querySelector('.load-btn');
        loadBtn?.addEventListener('click', () => {
            loadThemePreset(preset.name);
            showButtonFeedback(loadBtn as HTMLButtonElement, '✓ Loaded!');
        });

        // Delete button
        const deleteBtn = item.querySelector('.delete-btn');
        deleteBtn?.addEventListener('click', () => {
            showModal({
                title: '🗑️ Delete Preset',
                content: `Are you sure you want to delete "${preset.name}"?`,
                buttons: [
                    {
                        text: 'Cancel',
                        onClick: () => {}
                    },
                    {
                        text: 'Delete',
                        primary: true,
                        onClick: () => {
                            deleteThemePreset(preset.name);
                            updatePresetList();
                        }
                    }
                ]
            });
        });

        listContainer.appendChild(item);
    });
}

/**
 * Toggle floating window visibility
 */
export function toggleFloatingWindow(): void {
    if (!windowState.window) {
        createFloatingWindow();
    }

    const isVisible = windowState.window!.style.display === 'flex';
    windowState.window!.style.display = isVisible ? 'none' : 'flex';
    windowState.overlay!.style.display = isVisible ? 'none' : 'block';

    if (!isVisible) {
        updatePresetList();
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Cleanup UI elements
 */
export function cleanupUI(): void {
    if (windowState.window) {
        windowState.window.remove();
        windowState.window = null;
    }
    if (windowState.overlay) {
        windowState.overlay.remove();
        windowState.overlay = null;
    }
}
