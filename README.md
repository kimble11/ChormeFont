# 字型渲染 Font Rendering - Chrome Extension

基於 [F9y4ng/GreasyFork-Scripts](https://github.com/F9y4ng/GreasyFork-Scripts) 的 "字型渲染" 油猴腳本，改製為 Chrome 擴充套件。

## 功能特色

- **字型替換** - 選擇你喜歡的字型，替換網頁中的預設字型
- **字型平滑** - 啟用字型平滑渲染，讓文字更加清晰
- **字型縮放** - 調整字型大小比例 (0.8x ~ 2.0x)
- **字型描邊** - 為文字添加描邊效果 (0 ~ 1px)
- **字型陰影** - 為文字添加陰影效果 (0 ~ 4px)
- **Canvas 字型替換** - 替換 Canvas 畫布中的字型渲染
- **CSS 選擇器** - 自訂包含/排除的 CSS 選擇器
- **即時預覽** - 在彈出視窗中即時預覽字型效果

## 安裝方式

1. 開啟 Chrome 瀏覽器，前往 `chrome://extensions/`
2. 開啟右上角的「開發人員模式」
3. 點擊「載入未封裝的擴充套件」
4. 選擇 `font-rendering-extension` 資料夾
5. 安裝完成後，點擊工具列上的字型圖示即可開啟設定

## 使用方式

1. 點擊工具列上的字型圖示開啟設定視窗
2. 選擇你想要使用的字型
3. 調整各項參數（平滑、縮放、描邊、陰影等）
4. 點擊「套用設定」按鈕
5. 設定會自動套用到所有已開啟的分頁

## 支援的字型

### 繁體中文
- 蘋方-繁體 (PingFang TC)
- 思源黑體-繁體 (Source Han Sans TC)
- Noto Sans 繁體 (Noto Sans TC)
- 微軟正黑體 (Microsoft JhengHei)
- 微軟雅黑 (Microsoft YaHei)
- 宋體、楷體、仿宋、黑體等

### 簡體中文
- 蘋方-簡體 (PingFang SC)
- 思源黑體-簡體 (Source Han Sans SC)
- Noto Sans 簡體 (Noto Sans SC)
- SF Pro 簡體 (SF Pro SC)

### 英文字型
- Inter, Roboto, Open Sans, Lato, Nunito
- Montserrat, Fira Sans, Rubik, Raleway
- Ubuntu, Cantarell, Liberation Sans
- Segoe UI, Helvetica Neue, Arial, Georgia 等

## 檔案結構

```
font-rendering-extension/
├── manifest.json          # 擴充套件清單
├── background.js          # 背景服務工作程序
├── content/
│   └── font-rendering.js  # 字型渲染核心腳本
├── popup/
│   ├── popup.html         # 彈出視窗 HTML
│   ├── popup.css          # 彈出視窗樣式
│   └── popup.js           # 彈出視窗腳本
├── icons/
│   ├── icon16.png         # 16x16 圖示
│   ├── icon48.png         # 48x48 圖示
│   └── icon128.png        # 128x128 圖示
└── README.md
```

## 注意事項

- 字型替換的效果取決於系統中是否安裝了該字型
- 部分網頁可能因為 CSP 限制或特殊架構而無法正常應用
- 字型縮放可能會影響部分網頁的版面配置
- 描邊和陰影效果會增加渲染負荷，建議根據電腦效能調整

## 授權

原始腳本使用 GPL-3.0-only 授權，本擴充套件基於該腳本改製。
