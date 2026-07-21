# autodev-ng 專案指示

## GOAL 管理鐵律（使用者常設指示 2026-07-21）

1. **立任何 GOAL 前，先主動問使用者「大 GOAL（北極星）」**——這個方向存在是為了讓使用者
   能做什麼。不得自行揣測北極星就往下切小 GOAL。
2. 已確認的北極星在各專案 `data/<project>/NORTHSTAR.md`；小 GOAL 必須能對回北極星的價值判準，
   對不回去就不立案。
3. GOAL.md 格式鐵律（da39 事故教訓）：objective 寫在 `# GOAL` 標題**下一行起**（標題行本身
   會被解析器跳過）；驗收必須是 ```` ```sh ```` 圍欄的機械指令（紅→綠）；寫完用
   `parseGoal`（dist/autopilot/goal.js）實測解析再上。
4. 使用者痛點隨手記進 `data/<project>/USER-SIGNALS.md`（發掘器最高權重證據源）。

## 部署

- config/dist 變更需 daemon 重啟才生效；優先用單專案優雅重啟（restart.request 哨兵，
  GOAL 交付後），避免全艦隊 dance。
- 驗收鐵律：純提交狀態跑 `npm run build` + `npx vitest run` 全綠才部署。
