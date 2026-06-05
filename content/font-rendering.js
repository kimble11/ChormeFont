/*
 * Font Rendering Content Script
 * Based on F9y4ng/GreasyFork-Scripts "Font Rendering"
 * Transformed into a Chrome Extension content script
 *
 * Features:
 * - Font family override with selectable fonts
 * - Font smoothing (WebKit/Mozilla)
 * - Font size scaling
 * - Text stroke
 * - Text shadow
 * - CSS include/exclude selectors
 * - Canvas font override
 * - Monospace font support
 * - Site-specific exclusion
 */

(function () {
  "use strict";

  // ========== Configuration ==========
  const DEFAULT_CONFIG = {
    fontSelect: "Microsoft YaHei",
    fontFace: true,
    fontSmooth: true,
    macosMode: false,
    fontSize: 1.0,
    fontStroke: 0,
    fontShadow: 0,
    shadowColor: "#FFFFFFFF",
    fontCSS: "body, p, div, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, option",
    fontEx: "",
    fixStroke: true,
    renderCanvas: true,
    monospaceFont: "",
  };

  const DEFAULT_EXCLUDE_SITES = [
    "127.0.0.1",
    "localhost",
  ];

  // Available fonts list (common fonts on Windows/macOS)
  const AVAILABLE_FONTS = [
    { name: "Microsoft YaHei", ch: "微軟雅黑", en: "Microsoft YaHei" },
    { name: "PingFang SC", ch: "蘋方-簡體", en: "PingFang SC" },
    { name: "PingFang TC", ch: "蘋方-繁體", en: "PingFang TC" },
    { name: "Source Han Sans SC", ch: "思源黑體-簡體", en: "Source Han Sans SC" },
    { name: "Source Han Sans TC", ch: "思源黑體-繁體", en: "Source Han Sans TC" },
    { name: "Noto Sans CJK SC", ch: "Noto Sans 簡體", en: "Noto Sans CJK SC" },
    { name: "Noto Sans CJK TC", ch: "Noto Sans 繁體", en: "Noto Sans CJK TC" },
    { name: "Noto Sans SC", ch: "Noto Sans 簡體", en: "Noto Sans SC" },
    { name: "Noto Sans TC", ch: "Noto Sans 繁體", en: "Noto Sans TC" },
    { name: "SimSun", ch: "宋體", en: "SimSun" },
    { name: "NSimSun", ch: "新宋體", en: "NSimSun" },
    { name: "SimHei", ch: "黑體", en: "SimHei" },
    { name: "KaiTi", ch: "楷體", en: "KaiTi" },
    { name: "FangSong", ch: "仿宋", en: "FangSong" },
    { name: "Droid Sans Fallback", ch: "Droid Sans", en: "Droid Sans Fallback" },
    { name: "SF Pro SC", ch: "SF Pro 簡體", en: "SF Pro SC" },
    { name: "SF Pro TC", ch: "SF Pro 繁體", en: "SF Pro TC" },
    { name: "Segoe UI", ch: "Segoe UI", en: "Segoe UI" },
    { name: "Helvetica Neue", ch: "Helvetica Neue", en: "Helvetica Neue" },
    { name: "Arial", ch: "Arial", en: "Arial" },
    { name: "Georgia", ch: "Georgia", en: "Georgia" },
    { name: "Verdana", ch: "Verdana", en: "Verdana" },
    { name: "Tahoma", ch: "Tahoma", en: "Tahoma" },
    { name: "Roboto", ch: "Roboto", en: "Roboto" },
    { name: "Open Sans", ch: "Open Sans", en: "Open Sans" },
    { name: "Lato", ch: "Lato", en: "Lato" },
    { name: "Nunito", ch: "Nunito", en: "Nunito" },
    { name: "Inter", ch: "Inter", en: "Inter" },
    { name: "Fira Sans", ch: "Fira Sans", en: "Fira Sans" },
    { name: "Montserrat", ch: "Montserrat", en: "Montserrat" },
    { name: "Rubik", ch: "Rubik", en: "Rubik" },
    { name: "Raleway", ch: "Raleway", en: "Raleway" },
    { name: "Ubuntu", ch: "Ubuntu", en: "Ubuntu" },
    { name: "Cantarell", ch: "Cantarell", en: "Cantarell" },
    { name: "Liberation Sans", ch: "Liberation Sans", en: "Liberation Sans" },
    { name: "DejaVu Sans", ch: "DejaVu Sans", en: "DejaVu Sans" },
  ];

  const FONT_BASE = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const FONT_EMOJI = "'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";

  // ========== Utility Functions ==========

  // Detect all system fonts using document.fonts API + canvas comparison
  // document.fonts returns all fonts the browser knows about (system + loaded)
  function getSystemFonts() {
    try {
      const fonts = new Set();
      
      // Method 1: document.fonts API — returns ALL system fonts the browser knows about
      if (document.fonts) {
        document.fonts.forEach((font) => {
          // Filter out variable font instances and duplicates
          fonts.add(font.family);
        });
      }
      
      // Method 2: Use canvas-based detection for additional fonts
      // This checks a large list of common font names against a reference font
      const testChars = "CijlMwlm@#$%&*?0123456789";
      const testSize = "72px";
      const referenceFont = "monospace";
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Get reference fingerprint
      ctx.font = `${testSize} ${referenceFont}`;
      const refData = ctx.measureText(testChars).width;
      
      // Known font list — check each one
      const knownFonts = [
        // Windows system fonts
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
        "STSong-Light", "STCaiyun", "STHupo", "STHuanglong", "STLihuo",
        "STZhongsong", "STXingkai", "STXingshui", "STKaiti", "STLiti",
        // macOS system fonts
        "Apple Color Emoji", "Apple SD Gothic Neo", "AppleGothic", "AppleMyungjo",
        "Baskerville", "Bodoni 72", "Bodoni 72 Oldstyle", "Bodoni 72 Smallcaps",
        "Bradley Hand", "Chalkboard", "Chalkboard SE", "Chalkduster",
        "Cochin", "Copperplate", "Courier", "Courier New", "Damascus",
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
        "Marker Felt", "Menlo", "Microsoft Sans Serif", "Mishafi",
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
        "Songti SC", "Songti TC", "STHeiti", "STIXGeneral",
        "STIXIntegralsD", "STIXIntegralsSm", "STIXIntegralsUp",
        "STIXIntegralsUpD", "STIXIntegralsUpSm", "STIXNonUnicode",
        "STIXSizeFourSym", "STIXSizeOneSym", "STIXSizeThreeSym",
        "STIXSizeTwoSym", "STIXVariants", "STSong", "STXihei",
        "Sylfaen", "System", "Tahoma", "Thorndale AMT", "Times",
        "Times New Roman", "Trattatello", "Verdana", "Zapf Dingbats",
        // Google Fonts commonly installed
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
      ];
      
      for (const fontName of knownFonts) {
        ctx.font = `${testSize} "${fontName}"`;
        const testWidth = ctx.measureText(testChars).width;
        // If the width differs from the reference, the font is installed
        if (testWidth !== refData) {
          fonts.add(fontName);
        }
      }
      
      return Array.from(fonts).sort((a, b) => a.localeCompare(b, "zh-TW"));
    } catch (e) {
      console.warn("[Font Rendering] Failed to get system fonts:", e);
      return [];
    }
  }
 function isExcludedSite() {
    const hostname = window.location.hostname || "";
    return DEFAULT_EXCLUDE_SITES.some(site =>
      hostname === site || hostname.endsWith("." + site)
    );
  }

  function generateRandomString(length) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // ========== Font Rendering Engine ==========

  class FontRenderer {
    constructor() {
      this.config = { ...DEFAULT_CONFIG };
      this.styleNode = null;
      this.seed = generateRandomString(6);
      this.isTopWindow = window === window.top;
      this.isExcluded = isExcludedSite();
      this.observer = null;

      // Store original canvas methods
      this.originalFillText = CanvasRenderingContext2D.prototype.fillText;
      this.originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
    }

    // Apply font rendering to the page
    async apply() {
      if (this.isExcluded) {
        console.log("[Font Rendering] Excluded site, skipping.");
        return;
      }

      // Load config
      await this.loadConfig();

      // Generate and inject CSS
      this.injectCSS();

      // Apply canvas font override if enabled
      if (this.config.renderCanvas) {
        this.overrideCanvasFont();
      }

      // Observe for dynamically added content
      this.observe();
    }

    // Load config from chrome.storage
    async loadConfig() {
      try {
        const data = await chrome.storage.local.get(null);
        if (data && Object.keys(data).length > 0) {
          this.config = { ...DEFAULT_CONFIG, ...data };
        }
      } catch (e) {
        console.warn("[Font Rendering] Failed to load config:", e);
      }
    }

    // Generate the CSS text based on current config
    generateCSS() {
      const { fontSelect, fontFace, fontSmooth, macosMode, fontSize, fontStroke, fontShadow, shadowColor, fontCSS, fontEx } = this.config;

      // CSS include selectors
      const include = fontCSS || "body, p, div, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, option";
      // CSS exclude selectors
      const exclude = fontEx || "";

      let cssText = "";

      // Root pseudo-class with CSS custom properties
      const shadowCssText = this.generateTextShadow(fontShadow, shadowColor);
      const strokeCssText = `${fontStroke}px currentcolor`;

      cssText += `:root{
        --fr-font-basefont:${FONT_BASE};
        --fr-font-emoji:${FONT_EMOJI};
        --fr-font-family:${fontSelect};
        --fr-font-fontscale:${fontSize};
        --fr-font-shadow:${shadowCssText};
        --fr-font-stroke:${strokeCssText};
        --fr-render-text:optimizeLegibility;
        --fr-render-image:auto;
      }`;

      // Font family override
      if (fontFace && fontSelect) {
        const placeholder = "::placeholder";
        cssText += `:is(${include})${placeholder}{
          font-family:var(--fr-font-family),var(--fr-font-basefont),var(--fr-font-emoji)!important;
        }`;
        cssText += `:is(${include}){
          font-family:var(--fr-font-family),var(--fr-font-basefont),var(--fr-font-emoji)!important;
        }`;
      }

      // Font smoothing
      if (fontSmooth) {
        const isMac = /Mac|iPhone|iPad/i.test(navigator.platform);
        const smoothGecko = isMac ? "-moz-osx-font-smoothing:grayscale!important;" : "";
        const smoothMac = !isMac ? "-webkit-font-smoothing:antialiased!important;" : "";

        cssText += `:is(${include}){
          font-feature-settings:unset!important;
          font-variant:unset!important;
          text-rendering:optimizeLegibility!important;
          shape-rendering:geometricPrecision!important;
          image-rendering:auto!important;
          font-optical-sizing:auto!important;
          font-kerning:auto!important;
          ${smoothGecko}${smoothMac}
        }`;
      }

      // macOS rendering mode
      if (macosMode) {
        cssText += `:is(${include}){
          /* macOS-style subpixel font rendering */
          -webkit-font-smoothing:antialiased!important;
          -moz-osx-font-smoothing:grayscale!important;
          /* macOS letter-spacing — CJK uses wider tracking */
          letter-spacing:0.01em!important;
          /* macOS line-height — closer to macOS default */
          line-height:1.5!important;
          /* macOS font rendering — optimize for legibility with subpixel antialiasing */
          text-rendering:geometricPrecision!important;
          /* macOS font-synthesis — prevent bold from being too heavy */
          font-synthesis:none!important;
          /* macOS font-variant — disable contextual alternates by default */
          font-variant-ligatures:none!important;
          font-variant-caps:normal!important;
          font-variant-numeric:normal!important;
          /* macOS font-kerning — normal kerning */
          font-kerning:normal!important;
          /* macOS font-optical-sizing — enable for better small text */
          font-optical-sizing:auto!important;
          /* macOS text-underline-offset — underlines sit further from text */
          text-underline-offset:0.1em!important;
          /* macOS font-size-adjust — slight adjustment for CJK text */
          font-size-adjust:none!important;
          /* macOS font-weight — prevent synthetic bold from being too heavy */
          font-weight-adjust:none!important;
          /* macOS shape-rendering — geometric precision for crisp text */
          shape-rendering:geometricPrecision!important;
          /* macOS image-rendering — auto (no crisp-edges) */
          image-rendering:auto!important;
          /* macOS font-variation-settings — no variable font adjustments */
          font-variation-settings:normal!important;
          /* macOS color — prevent color fonts from interfering */
          color:inherit!important;
          /* macOS text-shadow — subtle text shadow for depth */
          text-shadow:0 0 0.5px rgba(0,0,0,0.05)!important;
        }`;

        // macOS heading adjustments — tighter letter-spacing for headings
        cssText += `:is(h1,h2,h3,h4,h5,h6){
          letter-spacing:0.005em!important;
          font-weight:600!important;
        }`;

        // macOS code block adjustments — monospace with proper rendering
        cssText += `:is(code,pre,pre code,pre span){
          -webkit-font-smoothing:subpixel-antialiased!important;
          letter-spacing:0!important;
          font-kerning:auto!important;
        }`;

        // macOS link adjustments — proper underline offset
        cssText += `:is(a){
          text-underline-offset:0.15em!important;
          text-decoration-thickness:1px!important;
        }`;
      }

      // Font size scaling
      if (fontSize !== 1 && fontSize > 0.8 && fontSize <= 2.5) {
        cssText += `:is(${include}){
          transform:scale(var(--fr-font-fontscale));
          transform-origin:left top;
        }`;
      }

      // Text stroke
      if (fontStroke > 0 && fontStroke <= 1.0) {
        cssText += `:is(${include}){
          -webkit-text-stroke:var(--fr-font-stroke);
        }`;
      }

      // Text shadow
      if (fontShadow > 0 && fontShadow <= 4) {
        cssText += `:is(${include}){
          text-shadow:var(--fr-font-shadow);
        }`;
      }

      // Exclude CSS
      if (exclude && (fontShadow > 0 || fontStroke > 0)) {
        const excludeSplit = (fontShadow > 0 ? "text-shadow:none!important;" : "") +
          (fontStroke > 0 ? "-webkit-text-stroke:0px transparent!important;" : "");
        cssText += `:is(${exclude}){${excludeSplit}}`;
      }

      // Selection styling fix (when stroke is enabled)
      if (fontStroke > 0) {
        const selectionCSS = `:is(:not(${exclude || ""}))::selection{
          color:#fff!important;
          background:#3367d1!important;
          -webkit-text-fill-color:#fff!important;
          ${fontShadow > 0 ? "text-shadow:none!important;" : ""}
          ${fontStroke > 0 ? "-webkit-text-stroke:0px transparent!important;" : ""}
        }`;
        cssText += selectionCSS;
      }

      // Bold fix for Chromium 96+
      if (fontStroke > 0 && this.config.fixStroke) {
        const boldAttrName = `fr-bold-${this.seed}`;
        cssText += `[${boldAttrName}],.${boldAttrName}{
          font-synthesis:weight style!important;
          -webkit-text-stroke:0px transparent!important;
        }`;
      }

      return cssText;
    }

    // Generate text shadow CSS value
    generateTextShadow(shadowSize, shadowColor) {
      if (shadowSize <= 0) return "none";
      const color = shadowColor || "#FFFFFFFF";
      return `0 0 ${shadowSize}px ${color}`;
    }

    // Inject CSS into the page
    injectCSS() {
      // Remove existing style if present
      if (this.styleNode) {
        this.styleNode.remove();
      }

      const cssText = this.generateCSS();
      if (!cssText) return;

      this.styleNode = document.createElement("style");
      this.styleNode.id = `fr-style-${this.seed}`;
      this.styleNode.textContent = cssText;

      // Insert at the beginning of <head>
      if (document.head) {
        document.head.insertBefore(this.styleNode, document.head.firstChild);
      } else {
        document.documentElement.appendChild(this.styleNode);
      }
    }

    // Override canvas font rendering
    overrideCanvasFont() {
      const selectedFont = this.config.fontSelect || "Microsoft YaHei";

      CanvasRenderingContext2D.prototype.fillText = function (...args) {
        const originalFont = this.font;
        if (!originalFont.includes(selectedFont)) {
          this.font = `${this.font.replace(/font-family[^;]*;?/, "")}${selectedFont}`;
        }
        return this.originalFillText.apply(this, args);
      };

      CanvasRenderingContext2D.prototype.strokeText = function (...args) {
        const originalFont = this.font;
        if (!originalFont.includes(selectedFont)) {
          this.font = `${this.font.replace(/font-family[^;]*;?/, "")}${selectedFont}`;
        }
        return this.originalStrokeText.apply(this, args);
      };
    }

    // Observe DOM mutations for dynamically loaded content
    observe() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new MutationObserver((mutations) => {
        // Re-apply CSS if our style node was removed
        if (!document.contains(this.styleNode)) {
          this.injectCSS();
        }
      });

      this.observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"]
      });
    }

    // Update config and re-apply
    async updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.injectCSS();

      // Re-apply canvas override if needed
      if (this.config.renderCanvas) {
        this.overrideCanvasFont();
      }
    }

    // Get list of available system fonts
    getSystemFontList() {
      return getSystemFonts();
    }

    // Destroy the renderer
    destroy() {
      if (this.styleNode) {
        this.styleNode.remove();
        this.styleNode = null;
      }
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      // Restore canvas methods
      CanvasRenderingContext2D.prototype.fillText = this.originalFillText;
      CanvasRenderingContext2D.prototype.strokeText = this.originalStrokeText;
    }
  }

  // ========== Initialize ==========

  // Create global instance
  let renderer = null;

  async function init() {
    renderer = new FontRenderer();
    await renderer.apply();
  }

  // Listen for messages from background/popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateConfig" && renderer) {
      renderer.updateConfig(message.config);
      sendResponse({ success: true });
    }

    if (message.action === "requestFonts" && renderer) {
      sendResponse({
        fonts: renderer.getSystemFontList(),
        availableFonts: AVAILABLE_FONTS
      });
    }

    if (message.action === "getConfig" && renderer) {
      sendResponse({ config: renderer.config });
    }

    if (message.action === "disable") {
      renderer.destroy();
      renderer = null;
      sendResponse({ success: true });
    }

    if (message.action === "reapply") {
      if (!renderer) {
        renderer = new FontRenderer();
        renderer.apply();
      }
      sendResponse({ success: true });
    }
  });

  // Initialize on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
