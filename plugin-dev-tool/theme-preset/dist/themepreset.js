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
  function normalizeShortcut(shortcut) {
    const parts = shortcut.split("+").map((p) => p.trim());
    const modifiers = [];
    let key = parts[parts.length - 1];
    const modifierParts = parts.slice(0, -1);
    for (const mod of modifierParts) {
      const normalized = mod.charAt(0).toUpperCase() + mod.slice(1).toLowerCase();
      modifiers.push(normalized);
    }
    key = key.toUpperCase();
    return [...modifiers, key].join("+");
  }
  function setShortcut(shortcut) {
    const normalized = normalizeShortcut(shortcut);
    setArg(`${PLUGIN_NAME}::shortcut`, normalized);
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
  function renameThemePreset(oldName, newName) {
    const presets = getPresets();
    const preset = presets.find((p) => p.name === oldName);
    if (!preset) {
      console.error(`Theme preset "${oldName}" not found`);
      return false;
    }
    const conflict = presets.find((p) => p.name === newName && p.name !== oldName);
    if (conflict) {
      console.error(`Theme preset "${newName}" already exists`);
      return false;
    }
    preset.name = newName;
    preset.timestamp = Date.now();
    savePresets(presets);
    const map = getCharacterThemeMap();
    let updated = false;
    for (const [charName, themeName] of Object.entries(map)) {
      if (themeName === oldName) {
        map[charName] = newName;
        updated = true;
      }
    }
    if (updated) {
      saveCharacterThemeMap(map);
    }
    if (getDefaultTheme() === oldName) {
      setDefaultTheme(newName);
    }
    console.log(`Theme preset renamed: "${oldName}" \u2192 "${newName}"`);
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
  function listThemePresets() {
    const presets = getPresets();
    return presets.map((p) => ({
      name: p.name,
      timestamp: p.timestamp,
      hasCSS: !!p.customCSS,
      hasHTML: !!p.guiHTML,
      theme: p.theme,
      colorSchemeName: p.colorSchemeName,
      textTheme: p.textTheme,
      hasCustomColors: !!p.colorScheme,
      hasCustomTextTheme: !!p.customTextTheme
    }));
  }
  function exportThemePreset(presetName) {
    const presets = getPresets();
    const preset = presets.find((p) => p.name === presetName);
    if (!preset) {
      console.error(`Theme preset "${presetName}" not found`);
      return null;
    }
    return JSON.stringify(preset, null, 2);
  }
  function importThemePreset(presetJson) {
    try {
      const preset = JSON.parse(presetJson);
      if (!preset.name || typeof preset.name !== "string") {
        console.error("Invalid preset format: missing name");
        return false;
      }
      const presets = getPresets();
      const filtered = presets.filter((p) => p.name !== preset.name);
      preset.timestamp = Date.now();
      filtered.push(preset);
      savePresets(filtered);
      console.log(`Theme preset "${preset.name}" imported successfully`);
      return true;
    } catch (e) {
      console.error("Failed to import theme preset:", e);
      return false;
    }
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
  function saveCharacterThemeMap(map) {
    setArg(`${PLUGIN_NAME}::characterThemeMap`, JSON.stringify(map));
  }
  function addCharacterThemeMapping(charName, themeName) {
    const map = getCharacterThemeMap();
    map[charName] = themeName;
    saveCharacterThemeMap(map);
    console.log(`Character "${charName}" mapped to theme "${themeName}"`);
  }
  function removeCharacterThemeMapping(charName) {
    const map = getCharacterThemeMap();
    delete map[charName];
    saveCharacterThemeMap(map);
    console.log(`Character "${charName}" mapping removed`);
  }
  function getDefaultTheme() {
    return getArg(`${PLUGIN_NAME}::defaultTheme`) || "";
  }
  function setDefaultTheme(themeName) {
    setArg(`${PLUGIN_NAME}::defaultTheme`, themeName);
  }

  // src/auto-switch.ts
  var autoSwitchInterval = null;
  var lastCharacterName = null;
  function getAutoSwitchEnabled() {
    const value = getArg(`${PLUGIN_NAME}::autoSwitch`);
    return value === "true" || value === true;
  }
  function setAutoSwitchEnabled(enabled) {
    setArg(`${PLUGIN_NAME}::autoSwitch`, enabled ? "true" : "false");
    if (enabled) {
      startAutoSwitch();
    } else {
      stopAutoSwitch();
    }
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

            <!-- Import/Export Section -->
            <div style="
                border-top: 1px solid var(--risu-theme-darkborderc, #333);
                border-bottom: 1px solid var(--risu-theme-darkborderc, #333);
                padding: 12px 0;
                margin-bottom: 20px;
            ">
                <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.8em; margin-bottom: 8px; text-align: center;">Import/Export</div>
                <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                    <button id="import-preset-file-btn" style="
                        padding: 10px 16px;
                        border-radius: 6px;
                        border: 1px solid var(--risu-theme-darkborderc, #333);
                        background: var(--risu-theme-darkbutton, #333);
                        color: var(--risu-theme-textcolor, #fff);
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 0.9em;
                        transition: all 0.2s;
                    " title="Import a single theme preset file">
                        \u{1F4C2} Import Theme File
                    </button>
                </div>
                <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.8em; margin: 12px 0 8px 0; text-align: center;">Complete Backup</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button id="export-all-btn" style="
                        padding: 10px 16px;
                        border-radius: 6px;
                        border: 1px solid var(--risu-theme-darkborderc, #333);
                        background: var(--risu-theme-darkbutton, #333);
                        color: var(--risu-theme-textcolor, #fff);
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 0.9em;
                        transition: all 0.2s;
                    " title="Export all themes + character mappings">
                        \u{1F4E6} Export Backup
                    </button>
                    <button id="import-all-btn" style="
                        padding: 10px 16px;
                        border-radius: 6px;
                        border: 1px solid var(--risu-theme-darkborderc, #333);
                        background: var(--risu-theme-darkbutton, #333);
                        color: var(--risu-theme-textcolor, #fff);
                        cursor: pointer;
                        font-weight: 500;
                        font-size: 0.9em;
                        transition: all 0.2s;
                    " title="Import all themes + character mappings">
                        \u{1F4E5} Import Backup
                    </button>
                </div>
            </div>

            <h4 style="color: var(--risu-theme-textcolor, #fff); margin: 20px 0 10px 0;">Saved Presets</h4>
            <div id="preset-list" style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Preset items will be added here dynamically -->
            </div>

            <!-- Character Auto-Switch Section -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--risu-theme-darkborderc, #333);">
                <h4 style="color: var(--risu-theme-textcolor, #fff); margin: 0 0 15px 0;">\u26A1 Character Auto-Switch</h4>

                <div style="margin-bottom: 15px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--risu-theme-textcolor, #fff);">
                        <input type="checkbox" id="auto-switch-toggle" style="cursor: pointer;">
                        <span>Enable automatic theme switching based on character</span>
                    </label>
                </div>

                <div id="auto-switch-content" style="display: none;">
                    <!-- Default Theme Display -->
                    <div id="default-theme-container" style="display: none; margin-bottom: 15px;">
                        <div style="color: var(--risu-theme-textcolor2, #aaa); font-size: 0.9em; margin-bottom: 5px;">
                            Default Theme:
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--risu-theme-darkbg, #1a1a1a); border-radius: 6px; border: 1px solid var(--risu-theme-darkborderc, #333);">
                            <span id="default-theme-name" style="color: var(--risu-theme-textcolor, #fff); flex: 1;"></span>
                            <button id="remove-default-theme-btn"
                                style="padding: 4px 8px; background: var(--risu-theme-red, #d32f2f); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;"
                                title="Remove default theme">
                                Remove
                            </button>
                        </div>
                    </div>

                    <!-- Current Character Display -->
                    <div style="margin-bottom: 10px;">
                        <div style="color: var(--risu-theme-textcolor2, #aaa); font-size: 0.9em; margin-bottom: 5px;">
                            Current Character: <strong id="current-character-name" style="color: var(--risu-theme-textcolor, #fff);">-</strong>
                        </div>
                    </div>

                    <!-- Character Theme Mappings List -->
                    <div style="margin-bottom: 15px;">
                        <div style="color: var(--risu-theme-textcolor2, #aaa); font-size: 0.9em; margin-bottom: 5px;">
                            Character Mappings:
                        </div>
                        <div id="character-mapping-list"
                            style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--risu-theme-darkbg, #1a1a1a); border-radius: 6px; border: 1px solid var(--risu-theme-darkborderc, #333);">
                            <div style="color: var(--risu-theme-textcolor2, #666); font-size: 0.9em; text-align: center; padding: 10px;">
                                No character mappings yet
                            </div>
                        </div>
                    </div>

                    <!-- Add Mapping Form -->
                    <div style="padding: 12px; background: var(--risu-theme-darkbg, #1a1a1a); border-radius: 6px; border: 1px solid var(--risu-theme-darkborderc, #333);">
                        <div style="color: var(--risu-theme-textcolor, #fff); font-size: 0.9em; margin-bottom: 10px; font-weight: 500;">
                            Add New Mapping:
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px;">
                            <div>
                                <label style="color: var(--risu-theme-textcolor2, #aaa); font-size: 0.85em; display: block; margin-bottom: 4px;">
                                    Character:
                                </label>
                                <input type="text" id="add-mapping-character" readonly
                                    style="width: 100%; padding: 8px; background: var(--risu-theme-bg, #2a2a2a); color: var(--risu-theme-textcolor, #fff); border: 1px solid var(--risu-theme-darkborderc, #333); border-radius: 4px; box-sizing: border-box;"
                                    placeholder="Current character will appear here">
                            </div>
                            <div>
                                <label style="color: var(--risu-theme-textcolor2, #aaa); font-size: 0.85em; display: block; margin-bottom: 4px;">
                                    Theme:
                                </label>
                                <select id="add-mapping-theme"
                                    style="width: 100%; padding: 8px; background: var(--risu-theme-bg, #2a2a2a); color: var(--risu-theme-textcolor, #fff); border: 1px solid var(--risu-theme-darkborderc, #333); border-radius: 4px; cursor: pointer; box-sizing: border-box;">
                                    <option value="">Select a theme...</option>
                                </select>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button id="add-mapping-btn"
                                    style="flex: 1; padding: 10px; background: var(--risu-theme-primary, #4a90e2); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: opacity 0.2s;"
                                    onmouseover="this.style.opacity='0.8'"
                                    onmouseout="this.style.opacity='1'">
                                    \u2795 Add Mapping
                                </button>
                                <button id="set-as-default-btn"
                                    style="padding: 10px 16px; background: var(--risu-theme-green, #4caf50); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: opacity 0.2s; white-space: nowrap;"
                                    onmouseover="this.style.opacity='0.8'"
                                    onmouseout="this.style.opacity='1'"
                                    title="Set selected theme as default for unmapped characters">
                                    Set as Default
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Hidden file input for imports -->
            <input type="file" id="import-file-input" accept=".json" style="display: none;">

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--risu-theme-darkborderc, #333);">
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;">
                    <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.85em;">
                        Press <strong id="shortcut-display" style="color: var(--risu-theme-textcolor, #fff);">${formatShortcutDisplay(getShortcut())}</strong> to toggle this window
                    </div>
                    <button id="change-shortcut-btn"
                        style="padding: 4px 10px; background: var(--risu-theme-darkbutton, #444); color: var(--risu-theme-textcolor, #fff); border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em; transition: opacity 0.2s;"
                        onmouseover="this.style.opacity='0.8'"
                        onmouseout="this.style.opacity='1'"
                        title="Change keyboard shortcut">
                        \u2328\uFE0F Change
                    </button>
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
    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleFloatingWindow();
    });
    windowState.overlay?.addEventListener("click", (e) => {
      e.stopPropagation();
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
    const importFileBtn = container.querySelector("#import-preset-file-btn");
    const fileInput = container.querySelector("#import-file-input");
    importFileBtn?.addEventListener("click", () => {
      fileInput?.click();
    });
    fileInput?.addEventListener("change", (e) => {
      const target = e.target;
      const file = target.files?.[0];
      if (!file)
        return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = event.target?.result;
          if (importThemePreset(json)) {
            showModal({
              title: "\u2713 Success",
              content: "Theme preset imported successfully!",
              buttons: [
                { text: "OK", primary: true, onClick: () => {
                } }
              ]
            });
            updatePresetList();
          } else {
            showModal({
              title: "\u274C Error",
              content: "Failed to import theme preset. Check console for errors.",
              buttons: [
                { text: "OK", primary: true, onClick: () => {
                } }
              ]
            });
          }
        } catch (error) {
          showModal({
            title: "\u274C Error",
            content: `Failed to read file: ${error.message}`,
            buttons: [
              { text: "OK", primary: true, onClick: () => {
              } }
            ]
          });
        }
        target.value = "";
      };
      reader.readAsText(file);
    });
    const exportAllBtn = container.querySelector("#export-all-btn");
    exportAllBtn?.addEventListener("click", () => {
      const presets = getPresets();
      const characterThemeMap = getCharacterThemeMap();
      const defaultTheme = getDefaultTheme();
      const autoSwitch = getAutoSwitchEnabled();
      if (presets.length === 0 && Object.keys(characterThemeMap).length === 0) {
        showModal({
          title: "\u26A0\uFE0F Warning",
          content: "No data to export",
          buttons: [
            { text: "OK", primary: true, onClick: () => {
            } }
          ]
        });
        return;
      }
      const backupData = {
        version: "1.0",
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        themePresets: presets,
        characterThemeMap,
        defaultTheme,
        autoSwitchEnabled: autoSwitch
      };
      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `risu_theme_backup_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const charMappingCount = Object.keys(characterThemeMap).length;
      showModal({
        title: "\u2713 Success",
        content: `Exported complete theme backup:<br>\u2022 ${presets.length} theme preset(s)<br>\u2022 ${charMappingCount} character mapping(s)<br>\u2022 Default theme: ${defaultTheme || "none"}`,
        buttons: [
          { text: "OK", primary: true, onClick: () => {
          } }
        ]
      });
    });
    const importAllBtn = container.querySelector("#import-all-btn");
    importAllBtn?.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = (e) => {
        const target = e.target;
        const file = target.files?.[0];
        if (!file)
          return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result);
            let backupData;
            let isOldFormat = false;
            if (Array.isArray(data)) {
              isOldFormat = true;
              backupData = {
                themePresets: data,
                characterThemeMap: {},
                defaultTheme: "",
                autoSwitchEnabled: false
              };
            } else if (data.version && data.themePresets) {
              backupData = data;
            } else {
              showModal({
                title: "\u274C Error",
                content: "Invalid file format. Expected theme backup file.",
                buttons: [
                  { text: "OK", primary: true, onClick: () => {
                  } }
                ]
              });
              return;
            }
            const presets = backupData.themePresets || [];
            const characterThemeMap = backupData.characterThemeMap || {};
            const defaultTheme = backupData.defaultTheme || "";
            const autoSwitchEnabled = backupData.autoSwitchEnabled || false;
            const charMappingCount = Object.keys(characterThemeMap).length;
            const contentMsg = isOldFormat ? `Found ${presets.length} preset(s) (old format).<br>How would you like to import them?` : `Found complete theme backup:<br>\u2022 ${presets.length} theme preset(s)<br>\u2022 ${charMappingCount} character mapping(s)<br>\u2022 Default theme: ${defaultTheme || "none"}<br><br>How would you like to import them?`;
            showModal({
              title: "\u{1F4E5} Import Theme Backup",
              content: contentMsg,
              buttons: [
                {
                  text: "Replace All",
                  primary: false,
                  onClick: () => {
                    savePresets(presets);
                    saveCharacterThemeMap(characterThemeMap);
                    setDefaultTheme(defaultTheme);
                    setAutoSwitchEnabled(autoSwitchEnabled);
                    updatePresetList();
                    showModal({
                      title: "\u2713 Success",
                      content: `Replaced all theme data:<br>\u2022 ${presets.length} preset(s)<br>\u2022 ${charMappingCount} character mapping(s)`,
                      buttons: [
                        { text: "OK", primary: true, onClick: () => {
                        } }
                      ]
                    });
                  }
                },
                {
                  text: "Merge",
                  primary: true,
                  onClick: () => {
                    const existing = getPresets();
                    const merged = [...existing];
                    let addedPresets = 0;
                    for (const preset of presets) {
                      const existingIndex = merged.findIndex((p) => p.name === preset.name);
                      if (existingIndex >= 0) {
                        merged[existingIndex] = preset;
                      } else {
                        merged.push(preset);
                        addedPresets++;
                      }
                    }
                    savePresets(merged);
                    const existingMap = getCharacterThemeMap();
                    const mergedMap = { ...existingMap, ...characterThemeMap };
                    saveCharacterThemeMap(mergedMap);
                    if (defaultTheme && !getDefaultTheme()) {
                      setDefaultTheme(defaultTheme);
                    }
                    updatePresetList();
                    showModal({
                      title: "\u2713 Success",
                      content: `Merged theme data:<br>\u2022 ${addedPresets} new preset(s) added<br>\u2022 ${presets.length - addedPresets} preset(s) updated<br>\u2022 ${Object.keys(characterThemeMap).length} character mapping(s) added`,
                      buttons: [
                        { text: "OK", primary: true, onClick: () => {
                        } }
                      ]
                    });
                  }
                },
                {
                  text: "Cancel",
                  onClick: () => {
                  }
                }
              ]
            });
          } catch (error) {
            showModal({
              title: "\u274C Error",
              content: `Failed to parse file: ${error.message}`,
              buttons: [
                { text: "OK", primary: true, onClick: () => {
                } }
              ]
            });
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
    const autoSwitchToggle = container.querySelector("#auto-switch-toggle");
    const autoSwitchContent = container.querySelector("#auto-switch-content");
    if (autoSwitchToggle) {
      autoSwitchToggle.checked = getAutoSwitchEnabled();
      if (autoSwitchToggle.checked) {
        autoSwitchContent.style.display = "block";
        updateAutoSwitchUI();
      }
      autoSwitchToggle.addEventListener("change", () => {
        const enabled = autoSwitchToggle.checked;
        setAutoSwitchEnabled(enabled);
        if (enabled) {
          autoSwitchContent.style.display = "block";
          updateAutoSwitchUI();
          startAutoSwitch();
        } else {
          autoSwitchContent.style.display = "none";
          stopAutoSwitch();
        }
      });
    }
    const removeDefaultBtn = container.querySelector("#remove-default-theme-btn");
    removeDefaultBtn?.addEventListener("click", () => {
      setDefaultTheme("");
      updateDefaultThemeDisplay();
      showButtonFeedback(removeDefaultBtn, "\u2713 Removed!");
    });
    const addMappingBtn = container.querySelector("#add-mapping-btn");
    const mappingCharInput = container.querySelector("#add-mapping-character");
    const mappingThemeSelect = container.querySelector("#add-mapping-theme");
    addMappingBtn?.addEventListener("click", () => {
      const character = mappingCharInput?.value.trim();
      const themeName = mappingThemeSelect?.value;
      if (!character) {
        showModal({
          title: "\u26A0\uFE0F Error",
          content: "No character selected. Please select a character first.",
          buttons: [{ text: "OK", primary: true }]
        });
        return;
      }
      if (!themeName) {
        showModal({
          title: "\u26A0\uFE0F Error",
          content: "Please select a theme to map to this character.",
          buttons: [{ text: "OK", primary: true }]
        });
        return;
      }
      addCharacterThemeMapping(character, themeName);
      updateCharacterMappingList();
      updateThemeSelectDropdown();
      showButtonFeedback(addMappingBtn, "\u2713 Added!");
    });
    const setDefaultBtn = container.querySelector("#set-as-default-btn");
    setDefaultBtn?.addEventListener("click", () => {
      const themeName = mappingThemeSelect?.value;
      if (!themeName) {
        showModal({
          title: "\u26A0\uFE0F Error",
          content: "Please select a theme to set as default.",
          buttons: [{ text: "OK", primary: true }]
        });
        return;
      }
      setDefaultTheme(themeName);
      updateDefaultThemeDisplay();
      showButtonFeedback(setDefaultBtn, "\u2713 Set as Default!");
    });
    const changeShortcutBtn = container.querySelector("#change-shortcut-btn");
    changeShortcutBtn?.addEventListener("click", () => {
      const currentShortcut = getShortcut();
      showModal({
        title: "\u2328\uFE0F Change Keyboard Shortcut",
        content: `
                <div style="margin-bottom: 15px;">
                    <div style="margin-bottom: 10px; color: var(--risu-theme-textcolor2, #aaa);">
                        Current shortcut: <strong style="color: var(--risu-theme-textcolor, #fff);">${formatShortcutDisplay(currentShortcut)}</strong>
                    </div>
                    <div style="margin-bottom: 10px; color: var(--risu-theme-textcolor2, #aaa); font-size: 0.9em;">
                        Enter a new keyboard shortcut:
                    </div>
                    <div style="padding: 10px; background: var(--risu-theme-darkbg, #1a1a1a); border-radius: 6px; border: 1px solid var(--risu-theme-darkborderc, #333); margin-bottom: 10px;">
                        <div style="font-size: 0.85em; color: var(--risu-theme-textcolor2, #888); margin-bottom: 8px;">
                            Examples:
                        </div>
                        <div style="font-size: 0.85em; color: var(--risu-theme-textcolor2, #aaa); line-height: 1.6;">
                            \u2022 <code style="background: var(--risu-theme-bg, #2a2a2a); padding: 2px 6px; border-radius: 3px;">ctrl+shift+p</code><br>
                            \u2022 <code style="background: var(--risu-theme-bg, #2a2a2a); padding: 2px 6px; border-radius: 3px;">alt+t</code><br>
                            \u2022 <code style="background: var(--risu-theme-bg, #2a2a2a); padding: 2px 6px; border-radius: 3px;">ctrl+alt+shift+z</code>
                        </div>
                    </div>
                </div>
            `,
        input: {
          value: currentShortcut,
          placeholder: "e.g., ctrl+shift+p"
        },
        buttons: [
          {
            text: "Cancel",
            onClick: () => {
            }
          },
          {
            text: "Save",
            primary: true,
            onClick: (inputValue) => {
              const newShortcut = inputValue?.trim().toLowerCase();
              if (!newShortcut) {
                showModal({
                  title: "\u26A0\uFE0F Error",
                  content: "Please enter a keyboard shortcut.",
                  buttons: [{ text: "OK", primary: true }]
                });
                return;
              }
              const validKeys = ["ctrl", "alt", "shift", "meta"];
              const parts = newShortcut.split("+").map((p) => p.trim());
              if (parts.length < 2) {
                showModal({
                  title: "\u26A0\uFE0F Invalid Shortcut",
                  content: "Shortcut must include at least one modifier key (ctrl, alt, shift) and one regular key.<br><br>Example: <code>ctrl+shift+p</code>",
                  buttons: [{ text: "OK", primary: true }]
                });
                return;
              }
              const lastKey = parts[parts.length - 1];
              const modifiers = parts.slice(0, -1);
              const hasModifier = modifiers.some((mod) => validKeys.includes(mod));
              if (!hasModifier) {
                showModal({
                  title: "\u26A0\uFE0F Invalid Shortcut",
                  content: "Shortcut must include at least one modifier key (ctrl, alt, shift).<br><br>Example: <code>ctrl+p</code>",
                  buttons: [{ text: "OK", primary: true }]
                });
                return;
              }
              const invalidModifiers = modifiers.filter((mod) => !validKeys.includes(mod));
              if (invalidModifiers.length > 0) {
                showModal({
                  title: "\u26A0\uFE0F Invalid Shortcut",
                  content: `Invalid modifier key(s): <strong>${invalidModifiers.join(", ")}</strong><br><br>Valid modifiers: ctrl, alt, shift, meta`,
                  buttons: [{ text: "OK", primary: true }]
                });
                return;
              }
              setShortcut(newShortcut);
              updateShortcutDisplay();
              showModal({
                title: "\u2713 Success",
                content: `Keyboard shortcut changed to: <strong>${formatShortcutDisplay(newShortcut)}</strong>`,
                buttons: [{ text: "OK", primary: true }]
              });
            }
          }
        ]
      });
    });
    const header = container.querySelector("#preset-window-header");
    let isDragging = false;
    let hasMoved = false;
    let dragOffset = { x: 0, y: 0 };
    header?.addEventListener("mousedown", (e) => {
      if (e.target.id === "close-preset-window") {
        return;
      }
      isDragging = true;
      hasMoved = false;
      const rect = container.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging)
        return;
      hasMoved = true;
      if (container.style.transform !== "none") {
        const rect = container.getBoundingClientRect();
        container.style.left = `${rect.left}px`;
        container.style.top = `${rect.top}px`;
        container.style.transform = "none";
      }
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
    const presets = listThemePresets();
    listContainer.innerHTML = "";
    if (presets.length === 0) {
      listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 3em; margin-bottom: 10px; opacity: 0.3;">\u{1F4E6}</div>
                <p style="color: var(--risu-theme-textcolor2, #888); margin: 0;">No presets saved yet</p>
                <p style="color: var(--risu-theme-textcolor2, #888); font-size: 0.85em; margin-top: 5px;">Create your first theme preset!</p>
            </div>
        `;
      return;
    }
    presets.forEach((preset) => {
      const item = document.createElement("div");
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
        preset.theme || "custom",
        preset.hasCustomColors ? "\u{1F3A8} Custom Colors" : null,
        preset.hasCustomTextTheme ? "\u{1F4DD} Text Theme" : null
      ].filter(Boolean).join(" \u2022 ");
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
                \u{1F4E5} Load
            </button>
            <button class="rename-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 10px; border-radius: 5px; border: none; background: var(--risu-theme-darkbutton, #444); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; transition: all 0.2s;"
                    title="Rename theme">
                \u270F\uFE0F
            </button>
            <button class="export-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 10px; border-radius: 5px; border: none; background: var(--risu-theme-darkbutton, #444); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; transition: all 0.2s;"
                    title="Export theme to file">
                \u{1F4BE}
            </button>
            <button class="delete-btn" data-name="${escapeHtml(preset.name)}"
                    style="padding: 6px 10px; border-radius: 5px; border: none; background: var(--risu-theme-draculared, #ff5555); color: var(--risu-theme-textcolor, #fff); cursor: pointer; font-size: 0.85em; transition: all 0.2s;"
                    title="Delete theme">
                \u{1F5D1}\uFE0F
            </button>
        `;
      item.addEventListener("mouseover", () => {
        item.style.borderColor = "var(--risu-theme-selected, #4a9eff)";
        item.style.boxShadow = "0 2px 8px rgba(74, 158, 255, 0.2)";
      });
      item.addEventListener("mouseout", () => {
        item.style.borderColor = "var(--risu-theme-darkborderc, #333)";
        item.style.boxShadow = "none";
      });
      const buttons = item.querySelectorAll("button");
      buttons.forEach((btn) => {
        btn.addEventListener("mouseover", () => {
          if (btn.classList.contains("load-btn")) {
            btn.style.transform = "scale(1.05)";
          } else if (btn.classList.contains("rename-btn") || btn.classList.contains("export-btn")) {
            btn.style.background = "var(--risu-theme-selected, #555)";
            btn.style.transform = "scale(1.05)";
          } else if (btn.classList.contains("delete-btn")) {
            btn.style.background = "#ff3333";
            btn.style.transform = "scale(1.05)";
          }
        });
        btn.addEventListener("mouseout", () => {
          btn.style.transform = "";
          if (btn.classList.contains("rename-btn") || btn.classList.contains("export-btn")) {
            btn.style.background = "var(--risu-theme-darkbutton, #444)";
          } else if (btn.classList.contains("delete-btn")) {
            btn.style.background = "var(--risu-theme-draculared, #ff5555)";
          }
        });
      });
      const loadBtn = item.querySelector(".load-btn");
      loadBtn?.addEventListener("click", () => {
        loadThemePreset(preset.name);
        showButtonFeedback(loadBtn, "\u2713 Loaded!");
      });
      const renameBtn = item.querySelector(".rename-btn");
      renameBtn?.addEventListener("click", () => {
        showModal({
          title: "\u270F\uFE0F Rename Theme Preset",
          content: `Enter a new name for "<strong>${escapeHtml(preset.name)}</strong>":`,
          input: {
            value: preset.name,
            placeholder: "New theme name"
          },
          buttons: [
            {
              text: "Cancel",
              primary: false,
              onClick: () => {
              }
            },
            {
              text: "Rename",
              primary: true,
              onClick: (newName) => {
                if (!newName || newName.trim() === "") {
                  showModal({
                    title: "\u26A0\uFE0F Warning",
                    content: "Please enter a valid name",
                    buttons: [{ text: "OK", primary: true, onClick: () => {
                    } }]
                  });
                  return;
                }
                newName = newName.trim();
                if (newName === preset.name) {
                  return;
                }
                const allPresets = getPresets();
                const conflict = allPresets.find((p) => p.name === newName);
                if (conflict) {
                  showModal({
                    title: "\u274C Name Conflict",
                    content: `A theme preset named "<strong>${escapeHtml(newName)}</strong>" already exists.<br><br>Please choose a different name.`,
                    buttons: [{ text: "OK", primary: true, onClick: () => {
                    } }]
                  });
                  return;
                }
                if (renameThemePreset(preset.name, newName)) {
                  updatePresetList();
                  showModal({
                    title: "\u2713 Success",
                    content: `Theme renamed: "<strong>${escapeHtml(preset.name)}</strong>" \u2192 "<strong>${escapeHtml(newName)}</strong>"`,
                    buttons: [{ text: "OK", primary: true, onClick: () => {
                    } }]
                  });
                } else {
                  showModal({
                    title: "\u274C Error",
                    content: "Failed to rename theme preset",
                    buttons: [{ text: "OK", primary: true, onClick: () => {
                    } }]
                  });
                }
              }
            }
          ]
        });
      });
      const exportBtn = item.querySelector(".export-btn");
      exportBtn?.addEventListener("click", () => {
        const json = exportThemePreset(preset.name);
        if (json) {
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${preset.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_theme_preset.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showButtonFeedback(exportBtn, "\u2713", "\u{1F4BE}");
        }
      });
      const deleteBtn = item.querySelector(".delete-btn");
      deleteBtn?.addEventListener("click", () => {
        showModal({
          title: "\u{1F5D1}\uFE0F Delete Theme Preset",
          content: `Delete theme preset "<strong>${escapeHtml(preset.name)}</strong>"?<br><br>This action cannot be undone.`,
          buttons: [
            {
              text: "Cancel",
              primary: false,
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
  function updateCharacterMappingList() {
    const listContainer = windowState.window?.querySelector("#character-mapping-list");
    if (!listContainer)
      return;
    const characterThemeMap = getCharacterThemeMap();
    const entries = Object.entries(characterThemeMap);
    if (entries.length === 0) {
      listContainer.innerHTML = `
            <div style="color: var(--risu-theme-textcolor2, #666); font-size: 0.9em; text-align: center; padding: 10px;">
                No character mappings yet
            </div>
        `;
      return;
    }
    listContainer.innerHTML = "";
    entries.forEach(([character, themeName]) => {
      const item = document.createElement("div");
      item.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            background: var(--risu-theme-bg, #2a2a2a);
            border-radius: 4px;
            border: 1px solid var(--risu-theme-darkborderc, #333);
        `;
      item.innerHTML = `
            <div style="flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0;">
                <div style="color: var(--risu-theme-textcolor, #fff); font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHtml(character)}
                </div>
                <div style="color: var(--risu-theme-textcolor2, #888); font-size: 0.75em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    \u2192 ${escapeHtml(themeName)}
                </div>
            </div>
            <button class="remove-mapping-btn" data-character="${escapeHtml(character)}"
                style="padding: 4px 8px; background: var(--risu-theme-red, #d32f2f); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75em; white-space: nowrap;"
                title="Remove mapping">
                Remove
            </button>
        `;
      const removeBtn = item.querySelector(".remove-mapping-btn");
      removeBtn?.addEventListener("click", () => {
        removeCharacterThemeMapping(character);
        updateCharacterMappingList();
        updateThemeSelectDropdown();
        showButtonFeedback(removeBtn, "\u2713");
      });
      listContainer.appendChild(item);
    });
  }
  function updateCurrentCharacterName() {
    const charNameElement = windowState.window?.querySelector("#current-character-name");
    const charInput = windowState.window?.querySelector("#add-mapping-character");
    if (!charNameElement || !charInput)
      return;
    try {
      const char = getChar();
      const charName = char?.name || "-";
      charNameElement.textContent = charName;
      charInput.value = charName === "-" ? "" : charName;
    } catch (error) {
      charNameElement.textContent = "-";
      charInput.value = "";
    }
  }
  function updateDefaultThemeDisplay() {
    const defaultContainer = windowState.window?.querySelector("#default-theme-container");
    const defaultNameElement = windowState.window?.querySelector("#default-theme-name");
    if (!defaultContainer || !defaultNameElement)
      return;
    const defaultTheme = getDefaultTheme();
    if (defaultTheme) {
      defaultContainer.style.display = "block";
      defaultNameElement.textContent = defaultTheme;
    } else {
      defaultContainer.style.display = "none";
    }
  }
  function updateThemeSelectDropdown() {
    const themeSelect = windowState.window?.querySelector("#add-mapping-theme");
    if (!themeSelect)
      return;
    const presets = getPresets();
    const currentValue = themeSelect.value;
    themeSelect.innerHTML = '<option value="">Select a theme...</option>';
    presets.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.name;
      option.textContent = preset.name;
      themeSelect.appendChild(option);
    });
    if (currentValue && presets.some((p) => p.name === currentValue)) {
      themeSelect.value = currentValue;
    }
  }
  function updateAutoSwitchUI() {
    updateCurrentCharacterName();
    updateDefaultThemeDisplay();
    updateCharacterMappingList();
    updateThemeSelectDropdown();
  }
  function updateShortcutDisplay() {
    const shortcutDisplayElement = windowState.window?.querySelector("#shortcut-display");
    if (!shortcutDisplayElement)
      return;
    shortcutDisplayElement.textContent = formatShortcutDisplay(getShortcut());
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
    const existingButtons = document.querySelectorAll(".theme-preset-settings-btn");
    existingButtons.forEach((btn) => btn.remove());
  }
  function debounce(func, wait) {
    let timeout = null;
    return function(...args) {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  }
  function ensureSettingsButton() {
    const existingButtons = document.querySelectorAll(".theme-preset-settings-btn");
    const colorSchemeLabels = Array.from(document.querySelectorAll("span.text-textcolor")).filter((el) => {
      const text = el.textContent || "";
      return text.includes("Color Scheme") || text.includes("\uC0C9\uC0C1") || text.includes("colorScheme");
    });
    if (colorSchemeLabels.length === 0) {
      existingButtons.forEach((btn2) => btn2.remove());
      return;
    }
    const label = colorSchemeLabels[0];
    let container = label.parentElement;
    if (!container)
      return;
    const existingBtn = container.querySelector(".theme-preset-settings-btn");
    if (existingBtn)
      return;
    existingButtons.forEach((btn2) => {
      if (!container.contains(btn2))
        btn2.remove();
    });
    let insertPoint = null;
    const textColorLabels = Array.from(document.querySelectorAll("span.text-textcolor")).filter((el) => {
      const text = el.textContent || "";
      return text.includes("Text Color") || text.includes("\uD14D\uC2A4\uD2B8") || text.includes("textColor");
    });
    if (textColorLabels.length > 0) {
      insertPoint = textColorLabels[0];
    }
    const btn = document.createElement("button");
    btn.className = "theme-preset-settings-btn";
    btn.style.cssText = `
        margin-top: 16px;
        margin-bottom: 8px;
        padding: 10px 16px;
        border-radius: 8px;
        border: 1px solid var(--risu-theme-darkborderc, #333);
        background: var(--risu-theme-darkbutton, #333);
        color: var(--risu-theme-textcolor, #fff);
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        width: 100%;
        transition: all 0.2s;
    `;
    btn.textContent = "\u{1F3A8} Theme Presets";
    btn.onmouseover = () => {
      btn.style.background = "var(--risu-theme-selected, #444)";
      btn.style.transform = "translateY(-1px)";
    };
    btn.onmouseout = () => {
      btn.style.background = "var(--risu-theme-darkbutton, #333)";
      btn.style.transform = "";
    };
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleFloatingWindow();
    };
    if (insertPoint && insertPoint.parentElement) {
      insertPoint.parentElement.insertBefore(btn, insertPoint);
    } else {
      container.appendChild(btn);
    }
  }
  function setupSettingsObserver() {
    const debouncedEnsureSettingsButton = debounce(ensureSettingsButton, 300);
    const observer = new MutationObserver(() => {
      debouncedEnsureSettingsButton();
    });
    const findSettingsContainer = () => {
      const headers = Array.from(document.querySelectorAll("h2")).filter((el) => {
        const text = el.textContent || "";
        return text.includes("Display") || text.includes("\uB514\uC2A4\uD50C\uB808\uC774") || text.includes("display");
      });
      if (headers.length > 0) {
        let container = headers[0].parentElement;
        for (let i = 0; i < 2 && container && container.parentElement; i++) {
          container = container.parentElement;
        }
        return container;
      }
      return null;
    };
    const settingsContainer = findSettingsContainer();
    if (settingsContainer) {
      observer.observe(settingsContainer, { childList: true, subtree: true });
      console.log("\u{1F3A8} Theme Preset: Observing settings container only");
    } else {
      observer.observe(document.body, { childList: true, subtree: true });
      console.log("\u{1F3A8} Theme Preset: Fallback to observing entire body");
    }
    return observer;
  }

  // src/index.ts
  console.log("\u{1F3A8} Theme Preset Manager: Initializing...");
  var settingsObserver = null;
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
    ensureSettingsButton();
    settingsObserver = setupSettingsObserver();
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
    if (settingsObserver) {
      settingsObserver.disconnect();
    }
  });