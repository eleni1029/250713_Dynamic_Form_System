# Dynamic Form System

## 專案架構

這是一個模組化的動態表單系統，採用前後端分離架構。

### 目錄結構

```
Dynamic_form_System/
├── frontend/                   # 前端 Vue 3 應用
│   ├── src/
│   │   ├── components/         # 通用組件
│   │   ├── views/             # 頁面組件
│   │   ├── stores/            # Pinia 狀態管理
│   │   ├── utils/             # 工具函數
│   │   ├── assets/            # 靜態資源
│   │   └── types/             # TypeScript 類型定義
│   └── public/                # 公共靜態文件
│
├── backend/                    # 後端 Node.js API
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   ├── models/            # 數據模型
│   │   ├── routes/            # 路由定義
│   │   ├── middleware/        # 中間件
│   │   ├── utils/             # 工具函數
│   │   └── services/          # 業務邏輯服務
│   └── config/                # 配置文件
│
├── projects/                   # 專案模組
│   ├── bmi-calculator/        # BMI 計算器
│   └── tdee-calculator/       # TDEE 計算器
│
├── shared/                     # 前後端共享
│   ├── types/                 # 共享類型定義
│   └── utils/                 # 共享工具函數
│
├── config/                     # 全局配置
└── docs/                       # 文檔
```

## 技術架構

### 前端
- Vue 3 + Composition API
- TypeScript
- Element Plus UI 組件庫
- Pinia 狀態管理
- Vue Router

### 後端
- Node.js
- Express.js
- PostgreSQL
- JWT 身份驗證

## 設計原則

1. **嚴格模組化**：每個專案（BMI、TDEE等）都是獨立模組
2. **可擴展性**：新專案只需在 projects/ 目錄添加文件夾
3. **代碼分離**：單個文件超過 500 行自動拆分
4. **類型安全**：全面使用 TypeScript

## 開發階段

### 第一階段功能
- [x] 基礎架構設計
- [ ] 用戶認證系統
- [ ] RWD 用戶界面
- [ ] BMI 計算器
- [ ] TDEE 計算器
- [ ] 管理後台

### 暫不實現
- 社交登錄
- 郵箱驗證
- 數據分析圖表
- 主題切換
- 國際化