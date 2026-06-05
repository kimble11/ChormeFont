/* ===== Font Rendering Extension Popup Script ===== */

document.addEventListener("DOMContentLoaded", async () => {
  // ========== DOM Elements ==========
  const elements = {
    fontSelect: document.getElementById("fontSelect"),
    fontSearch: document.getElementById("fontSearch"),
    fontCustom: document.getElementById("fontCustom"),
    fontCustomApply: document.getElementById("fontCustomApply"),
    fontFace: document.getElementById("fontFace"),
    fontSmooth: document.getElementById("fontSmooth"),
    fontSize: document.getElementById("fontSize"),
    fontSizeValue: document.getElementById("fontSizeValue"),
    fontStroke: document.getElementById("fontStroke"),
    fontStrokeValue: document.getElementById("fontStrokeValue"),
    fontShadow: document.getElementById("fontShadow"),
    fontShadowValue: document.getElementById("fontShadowValue"),
    shadowColor: document.getElementById("shadowColor"),
    renderCanvas: document.getElementById("renderCanvas"),
    fixStroke: document.getElementById("fixStroke"),
    fontCSS: document.getElementById("fontCSS"),
    fontEx: document.getElementById("fontEx"),
    applyBtn: document.getElementById("applyBtn"),
    resetBtn: document.getElementById("resetBtn"),
    status: document.getElementById("status"),
    previewBox: document.getElementById("previewBox"),
  };

  let allSystemFonts = [];

  // ========== Load Saved Config ==========
  await loadConfig();

  // ========== Detect System Fonts ==========
  // Strategy: load stored fonts first (instant), then try to refresh via content script
  await detectSystemFonts();

  // ========== Event Listeners ==========

  elements.fontSearch.addEventListener("input", () => {
    filterFonts(elements.fontSearch.value.toLowerCase());
  });

  // Custom font add button
  elements.fontCustomApply.addEventListener("click", () => {
    const fontName = elements.fontCustom.value.trim();
    if (!fontName) {
      showStatus("請輸入字型名稱", "error");
      return;
    }
    addFontToList(fontName);
    elements.fontCustom.value = "";
    showStatus(`已加入字型: ${fontName}`, "success");
  });

  // Also allow Enter key to add
  elements.fontCustom.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      elements.fontCustomApply.click();
    }
  });

  elements.fontSize.addEventListener("input", () => {
    elements.fontSizeValue.textContent = parseFloat(elements.fontSize.value).toFixed(2) + "x";
    updatePreview();
  });

  elements.fontStroke.addEventListener("input", () => {
    elements.fontStrokeValue.textContent = parseFloat(elements.fontStroke.value).toFixed(2) + "px";
    updatePreview();
  });

  elements.fontShadow.addEventListener("input", () => {
    elements.fontShadowValue.textContent = parseFloat(elements.fontShadow.value).toFixed(1) + "px";
    updatePreview();
  });

  elements.shadowColor.addEventListener("input", () => {
    updatePreview();
  });

  elements.fontSelect.addEventListener("change", () => {
    updatePreview();
  });

  elements.fontFace.addEventListener("change", () => {
    elements.fontSelect.disabled = !elements.fontFace.checked;
    updatePreview();
  });

  elements.fontSmooth.addEventListener("change", () => {
    updatePreview();
  });

  elements.applyBtn.addEventListener("click", async () => {
    const config = collectConfig();
    await chrome.storage.local.set(config);
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateConfig",
            config: config
          }).catch(() => {});
        }
      }
      showStatus("設定已套用！", "success");
    } catch (e) {
      showStatus("套用失敗: " + e.message, "error");
    }
  });

  elements.resetBtn.addEventListener("click", async () => {
    const defaultConfig = getDefaultConfig();
    await chrome.storage.local.set(defaultConfig);
    restoreUI(defaultConfig);
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: "updateConfig",
            config: defaultConfig
          }).catch(() => {});
        }
      }
      showStatus("已重置為預設設定", "success");
    } catch (e) {
      showStatus("重置失敗: " + e.message, "error");
    }
  });

  // ========== Detect System Fonts ==========
  async function detectSystemFonts() {
    try {
      const fonts = new Set();

      // --- Load previously saved custom fonts first ---
      const stored = await chrome.storage.local.get("customFonts");
      if (stored.customFonts && Array.isArray(stored.customFonts)) {
        stored.customFonts.forEach(f => fonts.add(f));
      }

      // --- Method 1: document.fonts in popup context ---
      // In the popup, document.fonts returns system fonts that the browser knows about.
      // This is the most reliable method for getting the full list.
      if (document.fonts) {
        document.fonts.forEach((font) => {
          fonts.add(font.family);
        });
      }

      // --- Method 2: Canvas pixel comparison ---
      // For fonts not detected by document.fonts, use canvas to check if they render differently
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const testString = "CijlMwlm@#$%&*?0123456789";

      // Reference: a font we know is NOT installed (unlikely name)
      ctx.font = "72px 'FakeNonExistentFont12345'";
      const refWidth = ctx.measureText(testString).width;

      // Extended font list including less common / beta fonts
      const knownFonts = [
        // Windows core
        "Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Cambria Math",
        "Candara", "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New",
        "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia",
        "HoloLens MDL2 Assets", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI",
        "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett",
        "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue",
        "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le",
        "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti",
        "MS Gothic", "MS PGothic", "MS UI Gothic", "MV Boli", "Myanmar Text",
        "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print",
        "Segoe Script", "Segoe UI", "Segoe UI Historic", "Segoe UI Emoji",
        "Segoe UI Symbol", "SimSun", "NSimSun", "SimHei", "KaiTi", "FangSong",
        "DengXian", "YouYuan", "LiSu", "STXingkai", "STXingshui", "STLiti",
        "STKaiti", "STSong", "STHupo", "STHuanglong", "STLihuo", "STHuaXing",
        "STZhongsong", "STCaiyun", "STFangsong", "STHengti", "STLanting",
        // macOS
        "Apple Color Emoji", "Apple SD Gothic Neo", "AppleGothic", "AppleMyungjo",
        "Baskerville", "Bodoni 72", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps",
        "Bradley Hand", "Chalkboard", "Chalkboard SE", "Chalkduster",
        "Cochin", "Copperplate", "Courier", "Damascus",
        "Didot", "Euphemia UCAS", "Futura", "Geneva", "Gill Sans",
        "Grantha Sangam MN", "Heiti SC", "Heiti TC", "Helvetica",
        "Helvetica Neue", "Herculanum", "Hiragino Kaku Gothic ProN",
        "Hiragino Maru Gothic ProN", "Hiragino Mincho ProN",
        "Hiragino Sans", "Hiragino Sans GB", "Hiragino Sans WN",
        "Hiragino Serif", "Hiragino Serif GB", "Hoefler Text",
        "Kailasa", "Kannada Sangam MN", "Kohinoor Devanagari",
        "Kohinoor Telugu", "Kohinoor Tamil", "Kohinoor Bangla",
        "Kohinoor Gujarati", "Kohinoor Marathi", "Kokonor",
        "Lao Sangam MN", "Lucida Grande", "Luminari", "Malayalam Sangam MN",
        "Marker Felt", "Menlo", "Mishafi",
        "Mukti Narrow", "Myna", "Myanmar Sangam MN", "Nadeem",
        "New Peninim MT", "Noteworthy", "Noto Sans", "Noto Sans CJK TC",
        "Noto Sans CJK SC", "Noto Sans CJK JP", "Noto Sans CJK KR",
        "Noto Sans TC", "Noto Sans SC", "Noto Serif", "Noto Serif CJK TC",
        "Noto Serif CJK SC", "Noto Serif TC", "Noto Serif SC",
        "Optima", "Palatino", "PingFang HK", "PingFang SC", "PingFang TC",
        "Plantagenet Cherokee", "Sana", "Savoye LET",
        "Source Han Sans TC", "Source Han Sans SC", "Source Han Sans CN",
        "Source Han Sans NT", "Source Han Sans KR",
        "Source Han Serif TC", "Source Han Serif SC", "Source Han Serif CN",
        "Source Han Serif NT", "Source Han Serif KR",
        "Songti SC", "Songti TC", "STHeiti",
        "Sylfaen", "Tahoma", "Thorndale AMT", "Times",
        "Times New Roman", "Trattatello", "Verdana", "Zapf Dingbats",
        // Google Fonts
        "Inter", "Roboto", "Open Sans", "Lato", "Nunito", "Montserrat",
        "Fira Sans", "Rubik", "Raleway", "Ubuntu", "Cantarell",
        "Liberation Sans", "DejaVu Sans", "Droid Sans Fallback",
        // Other
        "SF Pro Display", "SF Pro Text", "SF Mono", "SF Pro SC", "SF Pro TC",
        "SF NS", "SF Compact", "SF Compact Rounded",
        // Japanese
        "Yu Gothic", "Yu Gothic UI", "Meiryo", "Meiryo UI", "MS Mincho",
        "Yu Mincho", "Hiragino Kaku Gothic Pro", "Hiragino Mincho Pro",
        // Korean
        "Apple SD Gothic Neo", "Malgun Gothic", "Batang", "Dotum",
        "Gungsuh", "Gulim", "Guili", "BatangChe", "DotumChe",
        "GungsuhChe", "GulimChe", "AppleGothic", "AppleMyungjo",
        // Additional Windows fonts
        "Century Gothic", "Century Schoolbook", "Franklin Gothic Book",
        "Franklin Gothic Demo", "Franklin Gothic Heavy",
        "Franklin Gothic Medium Cond",
        "Garamond", "Haettenschweiler", "Jokerman", "Kristen ITC",
        "Lucida Bright", "Lucida Calligraphy", "Lucida Fax",
        "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter",
        "Monotype Corsiva", "Niagara Engraved", "Niagara Solid",
        "Pristina", "Rockwell", "Rockwell Condensed", "Rockwell Extra Bold",
        "Rockwell Extra Bold Condensed", "Segoe Fluent Icons",
        "SimSun-ExtB", "Sitka Banner", "Sitka Display",
        "Sitka Heading", "Sitka Small", "Sitka Subheading", "Sitka Text",
        "Trebuchet MS",
        // Taiwan / Taipei specific
        "Taipei Sans TC Beta", "Taipei Sans TC", "Taipei Sans TC Beta Beta",
        "Taipei Sans TC Bold", "Taipei Sans TC Light",
        // More Windows 11 fonts
        "Bierstadt", "Bierstadt Light", "Bierstadt Medium", "Bierstadt SemiLight",
        "Bierstadt Bold", "Bierstadt SemiBold",
        "Skeena", "Skeena Light", "Skeena Medium", "Skeena SemiLight",
        "Skeena Bold", "Skeena SemiBold",
        "Tenorite", "Tenorite Light", "Tenorite Medium", "Tenorite SemiLight",
        "Tenorite Bold", "Tenorite SemiBold",
        "Seaford", "Seaford Light", "Seaford Medium", "Seaford SemiLight",
        "Seaford Bold", "Seaford SemiBold",
        "Grandview", "Grandview Light", "Grandview Medium", "Grandview SemiLight",
        "Grandview Bold", "Grandview SemiBold",
        "Swis721 Lt", "Swis721 BlkEx", "Swis721 BdEx", "Swis721 BlkCn",
        "Swis721 BdCn", "Swis721 BdCnIt", "Swis721 BdExIt",
        // More fonts
        "Algerian", "Broadway", "Cooper Black", "Footlight MT Light",
        "Freestyle Script", "Haettenschweiler", "Harrington", "High Tower Text",
        "Imprint MT Shadow", "Juice ITC", "Stencil", "Tempus Sans ITC",
        "Tw Cen MT", "Viner Hand ITC", "Wide Latin",
        // Additional CJK fonts
        "AR PL UMing CN", "AR PL UMing HK", "AR PL UMing TW",
        "AR PL UMing TW MBE", "AR PL UKai CN", "AR PL UKai HK",
        "AR PL UKai TW", "AR PL UKai TW MBE",
        "Droid Sans Fallback", "Droid Sans Mono",
        "WenQuanYi Micro Hei", "WenQuanYi Micro Hei Mono",
        "WenQuanYi Zen Hei", "WenQuanYi Zen Hei Mono",
        "Lohit Devanagari", "Lohit Gujarati", "Lohit Bengali",
        "Noto Color Emoji", "Noto Emoji",
        "Noto Naskh Arabic", "Noto Sans Arabic",
        "Noto Sans Batak", "Noto Sans Ethiopic",
        "Noto Sans Khmer", "Noto Sans Lao",
        "Noto Sans Myanmar", "Noto Sans Myanma",
        "Noto Sans Sinhala", "Noto Sans Symbols2",
        "Noto Sans Symbols", "Noto Sans Tamil",
        "Noto Sans Telugu", "Noto Sans Thai",
        "Noto Sans Tifinagh", "Noto Sans Tibetan",
        "Noto Sans Vai", "Noto Serif Arabic",
        "Noto Serif Devanagari", "Noto Serif Sinhala",
        "Noto Serif Tibetan",
        // More Windows 10/11 fonts
        "Aptos", "Aptos Narrow", "Aptos Bold", "Aptos Light",
        "Tenorite", "Tenorite Light",
        // Custom / third party fonts that might be installed
        "Josefin Sans", "Playfair Display", "PT Sans", "PT Serif",
        "Work Sans", "Quicksand", "Poppins", "Crimson Text",
        "Merriweather", "Lora", "Montserrat", "Mulish",
        "IBM Plex Sans", "IBM Plex Mono", "IBM Plex Serif",
        "Red Hat Text", "Red Hat Display", "Source Code Pro",
        "Source Sans Pro", "Source Serif Pro",
        // Windows additional
        "Ami", "Aparajita", "Aparajita Light",
        "Aparajita SemiBold", "Aparajita Bold",
        "Aparajita Medium", "Aparajita SemiLight",
        "Aparajita ExtraLight",
        "Aparajita Light", "Aparajita Medium",
        "Aparajita SemiBold",
      ];

      for (const fontName of knownFonts) {
        if (fonts.has(fontName)) continue;
        ctx.font = "72px " + JSON.stringify(fontName).slice(1, -1);
        const testWidth = ctx.measureText(testString).width;
        if (testWidth !== refWidth) {
          fonts.add(fontName);
        }
      }

      allSystemFonts = Array.from(fonts).sort((a, b) => a.localeCompare(b, "zh-TW"));

      // Save to storage (includes custom fonts from before)
      await chrome.storage.local.set({ systemFonts: allSystemFonts });

      populateFontList(allSystemFonts);

      // Select saved font
      const savedFont = await chrome.storage.local.get("fontSelect");
      if (savedFont.fontSelect) {
        elements.fontSelect.value = savedFont.fontSelect;
      }

    } catch (e) {
      console.warn("Failed to detect system fonts:", e);
      const stored = await chrome.storage.local.get("systemFonts");
      if (stored.systemFonts && stored.systemFonts.length > 0) {
        allSystemFonts = stored.systemFonts;
        populateFontList(allSystemFonts);
      } else {
        allSystemFonts = getHardcodedFonts();
        populateFontList(allSystemFonts);
      }
    }
  }

  function populateFontList(fonts) {
    elements.fontSelect.innerHTML = "";
    fonts.forEach(font => {
      const option = document.createElement("option");
      option.value = font;
      option.textContent = font;
      option.dataset.font = font;
      elements.fontSelect.appendChild(option);
    });
    showStatus(`已載入 ${fonts.length} 種系統字型`, "success");
  }

  // Add a font to the list if not already present
  function addFontToList(fontName) {
    // Check if already in list
    const existing = elements.fontSelect.querySelector(`option[value="${fontName}"]`);
    if (existing) {
      showStatus(`字型 ${fontName} 已在列表中`, "error");
      return;
    }

    // Add to the select
    const option = document.createElement("option");
    option.value = fontName;
    option.textContent = fontName;
    option.dataset.font = fontName;
    elements.fontSelect.appendChild(option);

    // Add to allSystemFonts
    if (!allSystemFonts.includes(fontName)) {
      allSystemFonts.push(fontName);
      allSystemFonts.sort((a, b) => a.localeCompare(b, "zh-TW"));
    }

    // Save to both systemFonts (for display) and customFonts (for persistence across detection cycles)
    const saveData = { systemFonts: allSystemFonts };
    chrome.storage.local.get("customFonts").then(stored => {
      let customFonts = stored.customFonts || [];
      if (!customFonts.includes(fontName)) {
        customFonts.push(fontName);
      }
      saveData.customFonts = customFonts;
      chrome.storage.local.set(saveData);
    });

    // Select this font
    elements.fontSelect.value = fontName;
    updatePreview();
  }

  function filterFonts(term) {
    const options = elements.fontSelect.options;
    const currentVal = elements.fontSelect.value;
    for (let i = 0; i < options.length; i++) {
      const font = options[i].value.toLowerCase();
      if (!term || font.includes(term)) {
        options[i].style.display = "";
      } else {
        options[i].style.display = "none";
      }
    }
    if (term && currentVal) {
      const currentOption = elements.fontSelect.querySelector(`option[value="${currentVal}"]`);
      if (currentOption && currentOption.style.display === "none") {
        for (let i = 0; i < options.length; i++) {
          if (options[i].style.display !== "none") {
            elements.fontSelect.value = options[i].value;
            break;
          }
        }
      }
    }
  }

  async function loadConfig() {
    try {
      const data = await chrome.storage.local.get(null);
      if (data && Object.keys(data).length > 0) {
        restoreUI(data);
      } else {
        restoreUI(getDefaultConfig());
      }
    } catch (e) {
      console.warn("Failed to load config:", e);
      restoreUI(getDefaultConfig());
    }
  }

  function restoreUI(config) {
    elements.fontFace.checked = config.fontFace !== false;
    elements.fontSelect.disabled = !elements.fontFace.checked;
    elements.fontSmooth.checked = config.fontSmooth !== false;
    elements.fontSize.value = config.fontSize || 1.0;
    elements.fontSizeValue.textContent = (config.fontSize || 1.0).toFixed(2) + "x";
    elements.fontStroke.value = config.fontStroke || 0;
    elements.fontStrokeValue.textContent = (config.fontStroke || 0).toFixed(2) + "px";
    elements.fontShadow.value = config.fontShadow || 0;
    elements.fontShadowValue.textContent = (config.fontShadow || 0).toFixed(1) + "px";
    elements.shadowColor.value = config.shadowColor || "#ffffff";
    elements.renderCanvas.checked = config.renderCanvas !== false;
    elements.fixStroke.checked = config.fixStroke !== false;
    elements.fontCSS.value = config.fontCSS || "body, p, div, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, option";
    elements.fontEx.value = config.fontEx || "";
    updatePreview();
  }

  function collectConfig() {
    return {
      fontSelect: elements.fontSelect.value,
      fontFace: elements.fontFace.checked,
      fontSmooth: elements.fontSmooth.checked,
      fontSize: parseFloat(elements.fontSize.value),
      fontStroke: parseFloat(elements.fontStroke.value),
      fontShadow: parseFloat(elements.fontShadow.value),
      shadowColor: elements.shadowColor.value,
      renderCanvas: elements.renderCanvas.checked,
      fixStroke: elements.fixStroke.checked,
      fontCSS: elements.fontCSS.value.trim(),
      fontEx: elements.fontEx.value.trim(),
    };
  }

  function getDefaultConfig() {
    return {
      fontSelect: "Microsoft YaHei",
      fontFace: true,
      fontSmooth: true,
      fontSize: 1.0,
      fontStroke: 0,
      fontShadow: 0,
      shadowColor: "#ffffff",
      renderCanvas: true,
      fixStroke: true,
      fontCSS: "body, p, div, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, option",
      fontEx: "",
    };
  }

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = "status " + type;
    setTimeout(() => {
      elements.status.className = "status";
    }, 3000);
  }

  function getHardcodedFonts() {
    return [
      "Microsoft YaHei", "Microsoft JhengHei", "PingFang TC", "PingFang SC",
      "Source Han Sans TC", "Source Han Sans SC", "Noto Sans TC", "Noto Sans SC",
      "Noto Sans CJK TC", "Noto Sans CJK SC", "SimSun", "KaiTi", "FangSong", "SimHei",
      "Segoe UI", "Helvetica Neue", "Arial", "Georgia", "Verdana", "Tahoma",
      "Roboto", "Open Sans", "Inter", "Ubuntu", "DejaVu Sans",
    ];
  }

  function updatePreview() {
    const font = elements.fontFace.checked ? elements.fontSelect.value : "";
    const smooth = elements.fontSmooth.checked;
    const stroke = parseFloat(elements.fontStroke.value);
    const shadow = parseFloat(elements.fontShadow.value);
    const shadowColor = elements.shadowColor.value;

    const previewStyle = elements.previewBox.style;

    if (font) {
      previewStyle.fontFamily = `'${font}', sans-serif`;
    } else {
      previewStyle.fontFamily = "sans-serif";
    }

    if (smooth) {
      previewStyle.webkitFontSmoothing = "antialiased";
      previewStyle.webkitAntialias = "grayscale";
      previewStyle.MozOsxFontSmoothing = "grayscale";
    } else {
      previewStyle.webkitFontSmoothing = "";
      previewStyle.webkitAntialias = "";
      previewStyle.MozOsxFontSmoothing = "";
    }

    if (stroke > 0) {
      previewStyle.webkitTextStroke = `${stroke}px currentcolor`;
    } else {
      previewStyle.webkitTextStroke = "";
    }

    if (shadow > 0) {
      previewStyle.textShadow = `0 0 ${shadow}px ${shadowColor}`;
    } else {
      previewStyle.textShadow = "";
    }
  }

  updatePreview();
});
