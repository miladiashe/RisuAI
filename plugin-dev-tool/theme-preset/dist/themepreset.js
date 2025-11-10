//@name themepreset
//@display-name Theme Preset Manager
//@arg presets string
//@arg shortcut string
//@arg characterThemeMap string
//@arg autoSwitch string
//@arg defaultTheme string
//@link https://github.com/kwaroran/RisuAI Documentation

// src/constants.ts
  var DEFAULT_SHORTCUT = "Ctrl+Alt+X";
  var CHAR_POLL_INTERVAL = 2e3;
  var FEEDBACK_TIMEOUT = 1500;
  var FOCUS_DELAY = 100;
  var INIT_DELAY = 1e3;
  var PLUGIN_NAME = "themepreset";

  // src/shortcuts.ts
  function getShortcut() {
    const saved = getArg(`${PLUGIN_NAME}::shortcut`);
    return saved || DEFAULT_SHORTCUT;
  }
  function parseShortcut(shortcut) {
    const parts = shortcut.split("+").map((p) => p.trim());
    let key = parts[parts.length - 1];
    const modifierParts = parts.slice(0, -1);
    return {
      ctrl: modifierParts.includes("Ctrl"),
      alt: modifierParts.includes("Alt"),
      shift: modifierParts.includes("Shift"),
      meta: modifierParts.includes("Cmd") || modifierParts.includes("Meta"),
      key: key.toUpperCase()
    };
  }
  function isShortcutMatch(event, shortcut) {
    const parsed = parseShortcut(shortcut);
    const modifiersMatch = event.ctrlKey === parsed.ctrl && event.altKey === parsed.alt && event.shiftKey === parsed.shift && event.metaKey === parsed.meta;
    const keyMatch = event.key.toUpperCase() === parsed.key.toUpperCase();
    return modifiersMatch && keyMatch;
  }
  function formatShortcutDisplay(shortcut) {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    if (isMac) {
      return shortcut.replace("Ctrl", "\u2318").replace("Alt", "\u2325").replace("Shift", "\u21E7");
    }
    return shortcut;
  }

  // src/color-schemes.ts
  var colorSchemes = {
    "default": {
      bgcolor: "#282a36",
      darkbg: "#21222c",
      borderc: "#6272a4",
      selected: "#44475a",
      draculared: "#ff5555",
      textcolor: "#f8f8f2",
      textcolor2: "#64748b",
      darkBorderc: "#4b5563",
      darkbutton: "#374151",
      type: "dark"
    },
    "light": {
      bgcolor: "#ffffff",
      darkbg: "#f0f0f0",
      borderc: "#0f172a",
      selected: "#e0e0e0",
      draculared: "#ff5555",
      textcolor: "#0f172a",
      textcolor2: "#64748b",
      darkBorderc: "#d1d5db",
      darkbutton: "#e5e7eb",
      type: "light"
    },
    "cherry": {
      bgcolor: "#450a0a",
      darkbg: "#7f1d1d",
      borderc: "#ea580c",
      selected: "#d97706",
      draculared: "#ff5555",
      textcolor: "#f8f8f2",
      textcolor2: "#fca5a5",
      darkBorderc: "#92400e",
      darkbutton: "#b45309",
      type: "dark"
    },
    "galaxy": {
      bgcolor: "#0f172a",
      darkbg: "#1f2a48",
      borderc: "#8be9fd",
      selected: "#457b9d",
      draculared: "#ff5555",
      textcolor: "#f8f8f2",
      textcolor2: "#8be9fd",
      darkBorderc: "#457b9d",
      darkbutton: "#1f2a48",
      type: "dark"
    },
    "nature": {
      bgcolor: "#1b4332",
      darkbg: "#2d6a4f",
      borderc: "#a8dadc",
      selected: "#4d908e",
      draculared: "#ff5555",
      textcolor: "#f8f8f2",
      textcolor2: "#4d908e",
      darkBorderc: "#457b9d",
      darkbutton: "#2d6a4f",
      type: "dark"
    },
    "realblack": {
      bgcolor: "#000000",
      darkbg: "#000000",
      borderc: "#6272a4",
      selected: "#44475a",
      draculared: "#ff5555",
      textcolor: "#f8f8f2",
      textcolor2: "#64748b",
      darkBorderc: "#4b5563",
      darkbutton: "#374151",
      type: "dark"
    },
    "lite": {
      bgcolor: "#1f2937",
      darkbg: "#1C2533",
      borderc: "#475569",
      selected: "#475569",
      draculared: "#ff5555",
      textcolor: "#f8f8f2",
      textcolor2: "#64748b",
      darkBorderc: "#030712",
      darkbutton: "#374151",
      type: "dark"
    }
  };
  function applyColorScheme(colorSchemeName, customColorScheme) {
    let colorScheme;
    if (colorSchemeName === "custom" && customColorScheme) {
      colorScheme = customColorScheme;
    } else if (colorSchemes[colorSchemeName]) {
      colorScheme = colorSchemes[colorSchemeName];
    } else {
      colorScheme = colorSchemes.default;
    }
    document.documentElement.style.setProperty("--risu-theme-bgcolor", colorScheme.bgcolor);
    document.documentElement.style.setProperty("--risu-theme-darkbg", colorScheme.darkbg);
    document.documentElement.style.setProperty("--risu-theme-borderc", colorScheme.borderc);
    document.documentElement.style.setProperty("--risu-theme-selected", colorScheme.selected);
    document.documentElement.style.setProperty("--risu-theme-draculared", colorScheme.draculared);
    document.documentElement.style.setProperty("--risu-theme-textcolor", colorScheme.textcolor);
    document.documentElement.style.setProperty("--risu-theme-textcolor2", colorScheme.textcolor2);
    document.documentElement.style.setProperty("--risu-theme-darkborderc", colorScheme.darkBorderc);
    document.documentElement.style.setProperty("--risu-theme-darkbutton", colorScheme.darkbutton);
  }
  function applyTextTheme(textTheme, customTextTheme, colorSchemeType) {
    const root = document.documentElement;
    if (textTheme === "custom" && customTextTheme) {
      root.style.setProperty("--FontColorStandard", customTextTheme.FontColorStandard);
      root.style.setProperty("--FontColorItalic", customTextTheme.FontColorItalic);
      root.style.setProperty("--FontColorBold", customTextTheme.FontColorBold);
      root.style.setProperty("--FontColorItalicBold", customTextTheme.FontColorItalicBold);
      root.style.setProperty("--FontColorQuote1", customTextTheme.FontColorQuote1 ?? "#8BE9FD");
      root.style.setProperty("--FontColorQuote2", customTextTheme.FontColorQuote2 ?? "#FFB86C");
    } else if (textTheme === "highcontrast") {
      if (colorSchemeType === "dark") {
        root.style.setProperty("--FontColorStandard", "#f8f8f2");
        root.style.setProperty("--FontColorItalic", "#F1FA8C");
        root.style.setProperty("--FontColorBold", "#8BE9FD");
        root.style.setProperty("--FontColorItalicBold", "#FFB86C");
        root.style.setProperty("--FontColorQuote1", "#8BE9FD");
        root.style.setProperty("--FontColorQuote2", "#FFB86C");
      } else {
        root.style.setProperty("--FontColorStandard", "#0f172a");
        root.style.setProperty("--FontColorItalic", "#F1FA8C");
        root.style.setProperty("--FontColorBold", "#8BE9FD");
        root.style.setProperty("--FontColorItalicBold", "#FFB86C");
        root.style.setProperty("--FontColorQuote1", "#8BE9FD");
        root.style.setProperty("--FontColorQuote2", "#FFB86C");
      }
    } else {
      if (colorSchemeType === "dark") {
        root.style.setProperty("--FontColorStandard", "#fafafa");
        root.style.setProperty("--FontColorItalic", "#8C8D93");
        root.style.setProperty("--FontColorBold", "#fafafa");
        root.style.setProperty("--FontColorItalicBold", "#8C8D93");
        root.style.setProperty("--FontColorQuote1", "#8BE9FD");
        root.style.setProperty("--FontColorQuote2", "#FFB86C");
      } else {
        root.style.setProperty("--FontColorStandard", "#0f172a");
        root.style.setProperty("--FontColorItalic", "#8C8D93");
        root.style.setProperty("--FontColorBold", "#0f172a");
        root.style.setProperty("--FontColorItalicBold", "#8C8D93");
        root.style.setProperty("--FontColorQuote1", "#8BE9FD");
        root.style.setProperty("--FontColorQuote2", "#FFB86C");
      }
    }
  }
  function getColorSchemeType(colorSchemeName, colorScheme) {
    if (colorScheme && colorScheme.type) {
      return colorScheme.type;
    }
    if (colorSchemes[colorSchemeName]) {
      return colorSchemes[colorSchemeName].type;
    }
    return "dark";
  }

  // src/storage.ts
  function getPresets() {
    const presetsJson = getArg(`${PLUGIN_NAME}::presets`);
    if (!presetsJson || presetsJson === "") {
      return [];
    }
    try {
      return JSON.parse(presetsJson);
    } catch (e) {
      console.error("Failed to parse theme presets:", e);
      return [];
    }
  }
  function savePresets(presets) {
    setArg(`${PLUGIN_NAME}::presets`, JSON.stringify(presets));
  }
  function saveCurrentTheme(presetName) {
    const db = getDatabase();
    const presets = getPresets();
    const newPreset = {
      name: presetName,
      customCSS: db.customCSS || "",
      guiHTML: db.guiHTML || "",
      theme: db.theme || "",
      colorSchemeName: db.colorSchemeName || "",
      textTheme: db.textTheme || "standard",
      timestamp: Date.now()
    };
    if (db.colorSchemeName === "custom" && db.colorScheme) {
      newPreset.colorScheme = {
        type: db.colorScheme.type || "dark",
        bgcolor: db.colorScheme.bgcolor || "",
        darkbg: db.colorScheme.darkbg || "",
        borderc: db.colorScheme.borderc || "",
        selected: db.colorScheme.selected || "",
        draculared: db.colorScheme.draculared || "",
        darkBorderc: db.colorScheme.darkBorderc || "",
        darkbutton: db.colorScheme.darkbutton || "",
        textcolor: db.colorScheme.textcolor || "",
        textcolor2: db.colorScheme.textcolor2 || ""
      };
    }
    if (db.textTheme === "custom" && db.customTextTheme) {
      newPreset.customTextTheme = {
        FontColorStandard: db.customTextTheme.FontColorStandard || "",
        FontColorItalic: db.customTextTheme.FontColorItalic || "",
        FontColorBold: db.customTextTheme.FontColorBold || "",
        FontColorItalicBold: db.customTextTheme.FontColorItalicBold || "",
        FontColorQuote1: db.customTextTheme.FontColorQuote1 || null,
        FontColorQuote2: db.customTextTheme.FontColorQuote2 || null
      };
    }
    const filtered = presets.filter((p) => p.name !== presetName);
    filtered.push(newPreset);
    savePresets(filtered);
    console.log(`Theme preset "${presetName}" saved successfully`);
    return newPreset;
  }
  function loadThemePreset(presetName) {
    const presets = getPresets();
    const preset = presets.find((p) => p.name === presetName);
    if (!preset) {
      console.error(`Theme preset "${presetName}" not found`);
      return false;
    }
    const db = getDatabase();
    db.customCSS = preset.customCSS || "";
    db.guiHTML = preset.guiHTML || "";
    db.theme = preset.theme || "";
    db.colorSchemeName = preset.colorSchemeName || "";
    db.textTheme = preset.textTheme || "standard";
    if (preset.colorScheme) {
      db.colorScheme = {
        type: preset.colorScheme.type || "dark",
        bgcolor: preset.colorScheme.bgcolor || "",
        darkbg: preset.colorScheme.darkbg || "",
        borderc: preset.colorScheme.borderc || "",
        selected: preset.colorScheme.selected || "",
        draculared: preset.colorScheme.draculared || "",
        darkBorderc: preset.colorScheme.darkBorderc || "",
        darkbutton: preset.colorScheme.darkbutton || "",
        textcolor: preset.colorScheme.textcolor || "",
        textcolor2: preset.colorScheme.textcolor2 || ""
      };
    }
    if (preset.customTextTheme) {
      db.customTextTheme = {
        FontColorStandard: preset.customTextTheme.FontColorStandard || "",
        FontColorItalic: preset.customTextTheme.FontColorItalic || "",
        FontColorBold: preset.customTextTheme.FontColorBold || "",
        FontColorItalicBold: preset.customTextTheme.FontColorItalicBold || "",
        FontColorQuote1: preset.customTextTheme.FontColorQuote1 || null,
        FontColorQuote2: preset.customTextTheme.FontColorQuote2 || null
      };
    }
    setDatabase(db);
    applyColorScheme(preset.colorSchemeName, preset.colorScheme);
    const colorSchemeType = getColorSchemeType(preset.colorSchemeName, preset.colorScheme);
    applyTextTheme(preset.textTheme || "standard", preset.customTextTheme, colorSchemeType);
    const customCSS = preset.customCSS || "";
    const existingStyle = document.querySelector("#customcss");
    if (existingStyle) {
      existingStyle.innerHTML = customCSS;
    } else {
      const styleElement = document.createElement("style");
      styleElement.id = "customcss";
      styleElement.innerHTML = customCSS;
      document.body.appendChild(styleElement);
    }
    console.log(`Theme preset "${presetName}" loaded and applied successfully!`);
    return true;
  }
  function deleteThemePreset(presetName) {
    const presets = getPresets();
    const filtered = presets.filter((p) => p.name !== presetName);
    if (filtered.length === presets.length) {
      console.error(`Theme preset "${presetName}" not found`);
      return false;
    }
    savePresets(filtered);
    console.log(`Theme preset "${presetName}" deleted successfully`);
    return true;
  }
  function getCharacterThemeMap() {
    const mapJson = getArg(`${PLUGIN_NAME}::characterThemeMap`);
    if (!mapJson || mapJson === "") {
      return {};
    }
    try {
      return JSON.parse(mapJson);
    } catch (e) {
      console.error("Failed to parse character theme map:", e);
      return {};
    }
  }
  function getDefaultTheme() {
    return getArg(`${PLUGIN_NAME}::defaultTheme`) || "";
  }

  // src/auto-switch.ts
  var autoSwitchInterval = null;
  var lastCharacterName = null;
  function getAutoSwitchEnabled() {
    const value = getArg(`${PLUGIN_NAME}::autoSwitch`);
    return value === "true" || value === true;
  }
  function checkAndSwitchTheme() {
    if (!getAutoSwitchEnabled()) {
      return;
    }
    try {
      const char = getChar();
      if (!char || !char.name) {
        return;
      }
      if (char.name === lastCharacterName) {
        return;
      }
      lastCharacterName = char.name;
      const map = getCharacterThemeMap();
      const themeName = map[char.name];
      if (themeName) {
        console.log(`\u{1F3A8} Auto-switching to theme: ${themeName} for character: ${char.name}`);
        loadThemePreset(themeName);
      } else {
        const defaultTheme = getDefaultTheme();
        if (defaultTheme) {
          console.log(`\u{1F3A8} Auto-switching to default theme: ${defaultTheme} (no mapping for ${char.name})`);
          loadThemePreset(defaultTheme);
        }
      }
    } catch (e) {
      console.error("Failed to check and switch theme:", e);
    }
  }
  function startAutoSwitch() {
    if (autoSwitchInterval !== null) {
      return;
    }
    console.log("\u{1F3A8} Theme auto-switch enabled");
    checkAndSwitchTheme();
    autoSwitchInterval = window.setInterval(() => {
      checkAndSwitchTheme();
    }, CHAR_POLL_INTERVAL);
  }
  function stopAutoSwitch() {
    if (autoSwitchInterval !== null) {
      clearInterval(autoSwitchInterval);
      autoSwitchInterval = null;
      lastCharacterName = null;
      console.log("\u{1F3A8} Theme auto-switch disabled");
    }
  }
  function initAutoSwitch() {
    if (getAutoSwitchEnabled()) {
      startAutoSwitch();
    }
  }

  // src/ui.ts
  var windowState = {
    window: null,
    overlay: null,
    isDragging: false,
    dragOffset: { x: 0, y: 0 }
  };
  function showModal(options) {
    const { title, content, buttons = [], input = null } = options;
    const overlay = document.createElement("div");
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
    const modal = document.createElement("div");
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
        ${input ? `<input type="text" id="modal-input" value="${input.value || ""}" placeholder="${input.placeholder || ""}" style="
            width: 100%;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid var(--risu-theme-darkborderc, #333);
            background: var(--risu-theme-bgcolor, #2a2a2a);
            color: var(--risu-theme-textcolor, #fff);
            font-size: 0.95em;
            margin-bottom: 16px;
        ">` : ""}
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
        </div>
    `;
    const buttonContainer = modal.querySelector("div:last-child");
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.text;
      button.style.cssText = `
            padding: 10px 20px;
            border-radius: 6px;
            border: none;
            background: ${btn.primary ? "var(--risu-theme-selected, #4a9eff)" : "var(--risu-theme-darkbutton, #444)"};
            color: var(--risu-theme-textcolor, #fff);
            cursor: pointer;
            font-weight: ${btn.primary ? "600" : "500"};
            transition: all 0.2s;
        `;
      button.onmouseover = () => {
        button.style.transform = "translateY(-1px)";
        button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
      };
      button.onmouseout = () => {
        button.style.transform = "";
        button.style.boxShadow = "";
      };
      button.onclick = () => {
        const inputEl = modal.querySelector("#modal-input");
        const inputValue = input ? inputEl?.value : null;
        overlay.remove();
        if (btn.onClick)
          btn.onClick(inputValue);
      };
      buttonContainer.appendChild(button);
    });
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    if (input) {
      const inputEl = modal.querySelector("#modal-input");
      setTimeout(() => inputEl?.focus(), FOCUS_DELAY);
      inputEl?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const primaryBtn = buttons.find((b) => b.primary);
          if (primaryBtn) {
            overlay.remove();
            primaryBtn.onClick(inputEl.value);
          }
        }
      });
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }
  function showButtonFeedback(button, successText, originalText, successColor = "var(--draculared, #50fa7b)") {
    const origText = originalText || button.textContent || "";
    const origBg = button.style.background;
    button.textContent = successText;
    button.style.background = successColor;
    setTimeout(() => {
      button.textContent = origText;
      button.style.background = origBg;
    }, FEEDBACK_TIMEOUT);
  }
  function createFloatingWindow() {
    if (windowState.window) {
      return windowState.window;
    }
    const overlay = document.createElement("div");
    overlay.id = "theme-preset-overlay";
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
    const container = document.createElement("div");
    container.id = "theme-preset-floating-window";
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
                <span style="font-size: 1.2em;">\u{1F3A8}</span>
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
                \xD7
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
                    \u{1F4BE} Save Current
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
    setupEventListeners();
    updatePresetList();
    return container;
  }
  function setupEventListeners() {
    const container = windowState.window;
    if (!container)
      return;
    const closeBtn = container.querySelector("#close-preset-window");
    closeBtn?.addEventListener("click", () => {
      toggleFloatingWindow();
    });
    windowState.overlay?.addEventListener("click", () => {
      toggleFloatingWindow();
    });
    const saveBtn = container.querySelector("#save-preset-btn");
    const nameInput = container.querySelector("#preset-name-input");
    saveBtn?.addEventListener("click", () => {
      const name = nameInput?.value.trim();
      if (!name) {
        showModal({
          title: "\u26A0\uFE0F Error",
          content: "Please enter a preset name",
          buttons: [{ text: "OK", primary: true }]
        });
        return;
      }
      saveCurrentTheme(name);
      nameInput.value = "";
      updatePresetList();
      showButtonFeedback(saveBtn, "\u2713 Saved!");
    });
    nameInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveBtn?.dispatchEvent(new Event("click"));
      }
    });
    const header = container.querySelector("#preset-window-header");
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    header?.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = container.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      container.style.transform = "none";
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging)
        return;
      const x = e.clientX - dragOffset.x;
      const y = e.clientY - dragOffset.y;
      container.style.left = `${x}px`;
      container.style.top = `${y}px`;
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }
  function updatePresetList() {
    const listContainer = windowState.window?.querySelector("#preset-list");
    if (!listContainer)
      return;
    const presets = getPresets();
    listContainer.innerHTML = "";
    if (presets.length === 0) {
      listContainer.innerHTML = `
            <div style="color: var(--risu-theme-textcolor2, #888); text-align: center; padding: 20px;">
                No presets saved yet. Save your first preset above!
            </div>
        `;
      return;
    }
    presets.forEach((preset) => {
      const item = document.createElement("div");
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
      const loadBtn = item.querySelector(".load-btn");
      loadBtn?.addEventListener("click", () => {
        loadThemePreset(preset.name);
        showButtonFeedback(loadBtn, "\u2713 Loaded!");
      });
      const deleteBtn = item.querySelector(".delete-btn");
      deleteBtn?.addEventListener("click", () => {
        showModal({
          title: "\u{1F5D1}\uFE0F Delete Preset",
          content: `Are you sure you want to delete "${preset.name}"?`,
          buttons: [
            {
              text: "Cancel",
              onClick: () => {
              }
            },
            {
              text: "Delete",
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
  function toggleFloatingWindow() {
    if (!windowState.window) {
      createFloatingWindow();
    }
    const isVisible = windowState.window.style.display === "flex";
    windowState.window.style.display = isVisible ? "none" : "flex";
    windowState.overlay.style.display = isVisible ? "none" : "block";
    if (!isVisible) {
      updatePresetList();
    }
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function cleanupUI() {
    if (windowState.window) {
      windowState.window.remove();
      windowState.window = null;
    }
    if (windowState.overlay) {
      windowState.overlay.remove();
      windowState.overlay = null;
    }
  }

  // src/index.ts
  console.log("\u{1F3A8} Theme Preset Manager: Initializing...");
  function setupKeyboardShortcut() {
    document.addEventListener("keydown", (e) => {
      const shortcut = getShortcut();
      if (isShortcutMatch(e, shortcut)) {
        e.preventDefault();
        toggleFloatingWindow();
      }
    });
  }
  function init() {
    createFloatingWindow();
    setupKeyboardShortcut();
    initAutoSwitch();
    console.log("\u{1F3A8} Theme Preset Manager: Ready!");
    console.log(`   Press ${getShortcut()} to open the theme manager`);
  }
  setTimeout(() => {
    init();
  }, INIT_DELAY);
  onUnload(() => {
    console.log("\u{1F3A8} Theme Preset Manager: Cleaning up...");
    stopAutoSwitch();
    cleanupUI();
  });