# SINYA Annual P&L Dashboard v4 (Simplified)

符合你的最新欄位規格：
- 可填寫欄位：**Category, Brand, Owner, YearSales_2025, YearGP_2025**
- 取消：**MonthSales_2025 / MonthGP_2025**
- 可填：**SalesGrowth_2026% / GPGrowth_2026%**
- 自動計算：**GPMargin_2025、2026 的 Sales/GP、GPMargin_2026（含情境乘數）**

## CSV 標頭（請一致）
`Category, Brand, Owner, YearSales_2025, YearGP_2025, SalesGrowth_2026%, GPGrowth_2026%, Notes`

## 計算邏輯
- `Sales_2026 = YearSales_2025 × (1 + SalesGrowth_2026%) × Scenario`
- `GP_2026 = YearGP_2025 × (1 + GPGrowth_2026%) × Scenario`
- `GPMargin_2026 = GP_2026 / Sales_2026`（自動）
- 頁面上另顯示總 KPI 與 YoY。

## 使用
1. 上傳你的 CSV 或貼上 Google Sheet 的「發佈為 CSV」連結。
2. 在頁面左上「Scenario」選 Base/Optimistic/Conservative。
3. 資料總表會自動顯示 2026 的 Sales/GP 與 **GPMargin_2026**。

## GitHub Pages
與先前版本相同：將本資料夾上傳 GitHub Repo，**Settings → Pages → Deploy from a branch**。
