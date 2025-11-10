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
    setDefaultTheme,
    listThemePresets
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

    const presets = listThemePresets();
    listContainer.innerHTML = '';

    if (presets.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 3em; margin-bottom: 10px; opacity: 0.3;">📦</div>
                <p style="color: var(--risu-theme-textcolor2, #888); margin: 0;">No presets saved yet</p>
                <p style="color: var(--risu-theme-textcolor2, #888); font-size: 0.85em; margin-top: 5px;">Create your first theme preset!</p>
            </div>
        `;
        return;
    }

    presets.forEach(preset => {
        const item = document.createElement('div');
        item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 14px;
            background: var(--risu-theme-bgcolor, #2a2a2a);
            border-radius: 8px;
            border: 2px solid var(--risu-theme-darkborderc, #333);
            transition: border-color 0.2s, box-shadow 0.2s;
            margin-bottom: 8px;
        `;

        const date = new Date(preset.timestamp).toLocaleDateString();
        const detailsText = [
            date,
            preset.theme || 'custom',
            preset.hasCustomColors ? '🎨 Custom Colors' : null,
            preset.hasCustomTextTheme ? '📝 Text Theme' : null
        ].filter(Boolean).join(' • ');

        item.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div style="color: var(--risu-theme-textcolor, #fff); font-weight: 500; font-size: 0.95em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(preset.name)}
                </div>
                <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.8em; margin-top: 2px;">
                    ${detailsText}
                </div>
            </div>
            <button class="load-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 12px; border-radius: 5px; border: none; background: var(--risu-theme-selected, #4a9eff); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; font-weight: 500; white-space: nowrap; transition: all 0.2s;"
                    title="Load theme">
                📥 Load
            </button>
            <button class="rename-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 10px; border-radius: 5px; border: none; background: var(--risu-theme-darkbutton, #444); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; transition: all 0.2s;"
                    title="Rename theme">
                ✏️
            </button>
            <button class="export-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 10px; border-radius: 5px; border: none; background: var(--risu-theme-darkbutton, #444); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; transition: all 0.2s;"
                    title="Export theme to file">
                💾
            </button>
            <button class="delete-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 10px; border-radius: 5px; border: none; background: var(--risu-theme-draculared, #ff5555); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; transition: all 0.2s;"
                    title="Delete theme">
                🗑️
            </button>
        `;

        // Hover effects
        item.addEventListener('mouseover', () => {
            item.style.borderColor = 'var(--risu-theme-selected, #4a9eff)';
            item.style.boxShadow = '0 2px 8px rgba(74, 158, 255, 0.2)';
        });
        item.addEventListener('mouseout', () => {
            item.style.borderColor = 'var(--risu-theme-darkborderc, #333)';
            item.style.boxShadow = 'none';
        });

        // Button hover effects
        const buttons = item.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseover', () => {
                if (btn.classList.contains('load-btn')) {
                    (btn as HTMLElement).style.transform = 'scale(1.05)';
                } else if (btn.classList.contains('rename-btn') || btn.classList.contains('export-btn')) {
                    (btn as HTMLElement).style.background = 'var(--risu-theme-selected, #555)';
                    (btn as HTMLElement).style.transform = 'scale(1.05)';
                } else if (btn.classList.contains('delete-btn')) {
                    (btn as HTMLElement).style.background = '#ff3333';
                    (btn as HTMLElement).style.transform = 'scale(1.05)';
                }
            });
            btn.addEventListener('mouseout', () => {
                (btn as HTMLElement).style.transform = '';
                if (btn.classList.contains('rename-btn') || btn.classList.contains('export-btn')) {
                    (btn as HTMLElement).style.background = 'var(--risu-theme-darkbutton, #444)';
                } else if (btn.classList.contains('delete-btn')) {
                    (btn as HTMLElement).style.background = 'var(--risu-theme-draculared, #ff5555)';
                }
            });
        });

        // Load button
        const loadBtn = item.querySelector('.load-btn');
        loadBtn?.addEventListener('click', () => {
            loadThemePreset(preset.name);
            showButtonFeedback(loadBtn as HTMLButtonElement, '✓ Loaded!');
        });

        // Rename button
        const renameBtn = item.querySelector('.rename-btn');
        renameBtn?.addEventListener('click', () => {
            showModal({
                title: '✏️ Rename Theme Preset',
                content: `Enter a new name for "<strong>${escapeHtml(preset.name)}</strong>":`,
                input: {
                    value: preset.name,
                    placeholder: 'New theme name'
                },
                buttons: [
                    {
                        text: 'Cancel',
                        primary: false,
                        onClick: () => {}
                    },
                    {
                        text: 'Rename',
                        primary: true,
                        onClick: (newName: string) => {
                            if (!newName || newName.trim() === '') {
                                showModal({
                                    title: '⚠️ Warning',
                                    content: 'Please enter a valid name',
                                    buttons: [{ text: 'OK', primary: true, onClick: () => {} }]
                                });
                                return;
                            }

                            newName = newName.trim();

                            if (newName === preset.name) {
                                return; // No change
                            }

                            // Check if new name already exists
                            const allPresets = getPresets();
                            const conflict = allPresets.find(p => p.name === newName);
                            if (conflict) {
                                showModal({
                                    title: '❌ Name Conflict',
                                    content: `A theme preset named "<strong>${escapeHtml(newName)}</strong>" already exists.<br><br>Please choose a different name.`,
                                    buttons: [{ text: 'OK', primary: true, onClick: () => {} }]
                                });
                                return;
                            }

                            if (renameThemePreset(preset.name, newName)) {
                                updatePresetList();
                                showModal({
                                    title: '✓ Success',
                                    content: `Theme renamed: "<strong>${escapeHtml(preset.name)}</strong>" → "<strong>${escapeHtml(newName)}</strong>"`,
                                    buttons: [{ text: 'OK', primary: true, onClick: () => {} }]
                                });
                            } else {
                                showModal({
                                    title: '❌ Error',
                                    content: 'Failed to rename theme preset',
                                    buttons: [{ text: 'OK', primary: true, onClick: () => {} }]
                                });
                            }
                        }
                    }
                ]
            });
        });

        // Export button
        const exportBtn = item.querySelector('.export-btn');
        exportBtn?.addEventListener('click', () => {
            const json = exportThemePreset(preset.name);
            if (json) {
                // Create a Blob from the JSON string
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                // Create a temporary download link
                const a = document.createElement('a');
                a.href = url;
                a.download = `${preset.name.replace(/[^a-zA-Z0-9-_]/g, '_')}_theme_preset.json`;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Show success feedback
                showButtonFeedback(exportBtn as HTMLButtonElement, '✓', '💾');
            }
        });

        // Delete button
        const deleteBtn = item.querySelector('.delete-btn');
        deleteBtn?.addEventListener('click', () => {
            showModal({
                title: '🗑️ Delete Theme Preset',
                content: `Delete theme preset "<strong>${escapeHtml(preset.name)}</strong>"?<br><br>This action cannot be undone.`,
                buttons: [
                    {
                        text: 'Cancel',
                        primary: false,
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
