# SINYA Annual P&L Dashboard (GitHub Pages Ready)

靜態版 Dashboard，支援直接上傳 CSV 或載入 Google Sheet「發佈成 CSV」連結。

## 功能
- KPI 卡：2025 營收/毛利、2026 情境推估與 YoY%
- 情境切換：Base/Optimistic/Conservative（Multiplier 1.00/1.08/0.92）
- 異常偵測：
  - YearSales_2025 = 0 且 YearGP_2025 > 0
  - YearGP_2025 < 0
  - GPMargin_2025 > 60%
- 資料表：可搜尋、點欄位標題排序
- 匯出異常清單：一鍵下載 anomalies.csv
- 直接部署到 GitHub Pages（純前端，無伺服器）

## 檔案結構
```
.
├─ index.html
├─ styles.css
├─ app.js
└─ sample_data.csv
```

## 欄位格式（CSV 標頭需一致）
`Category, Brand, Owner, YearSales_2025, YearGP_2025, MonthSales_2025, MonthGP_2025, SalesGrowth_2026%, GPGrowth_2026%, Notes`

> 若欄位名稱與你的 Google Sheet 不同，請先在 Google Sheet 建立對應標頭再匯出 CSV。

## 使用
1. 直接在頁面右上角 **載入 CSV** 或貼上 **Google Sheet 發佈 CSV 連結**（確保任何知道連結者可存取）。
2. 選擇情境（Scenario），KPI 與表格即時更新。
3. 點「匯出異常清單 CSV」可下載需檢查項目。

## 部署到 GitHub Pages
1. 在 GitHub 建立新 repo（Public）。
2. 上傳本資料夾內全部檔案。
3. 進入 **Settings → Pages**，Source 選擇 **Deploy from a branch**，Branch 選擇 `main`（或 `master`），資料夾選 `/root`。
4. 儲存後，稍候即可在 Pages 網址看到你的 Dashboard。

## 進階
- 想把「情境係數」做成可自訂？可在 `index.html` 內加入自訂輸入框，並在 `app.js` 調整 `scenarioSelect` 來源。
- 若 CSV 需要含有逗號與引號的欄位，建議用 Google Sheet 原生 **檔案 → 下載 → 逗號分隔值 (.csv)**，避免手動輸出造成格式破損。
