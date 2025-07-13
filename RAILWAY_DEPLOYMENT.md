# Railway 部署指南

## 部署步驟

### 1. 準備Railway帳號
- 前往 [Railway.app](https://railway.app) 註冊帳號
- 連接你的GitHub帳號

### 2. 創建Railway專案
```bash
# 安裝Railway CLI
npm install -g @railway/cli

# 登錄Railway
railway login

# 創建新專案
railway project create dynamic-form-system
```

### 3. 部署後端

#### 創建後端服務
```bash
cd backend
railway service create backend
railway link
```

#### 添加PostgreSQL數據庫
```bash
railway add postgresql
```

#### 設置環境變數
在Railway儀表板中設置以下環境變數：

**必需變數：**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**自動設置的變數：**
- `DATABASE_URL` - Railway PostgreSQL自動提供
- `RAILWAY_STATIC_URL` - Railway自動生成的URL

#### 部署後端
```bash
railway up
```

### 4. 部署前端

#### 創建前端服務
```bash
cd ../frontend
railway service create frontend
railway link
```

#### 設置前端環境變數
```
VITE_API_BASE_URL=https://your-backend-service.railway.app/api
VITE_APP_TITLE=Dynamic Form System
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

#### 部署前端
```bash
railway up
```

### 5. 配置CORS

在後端環境變數中更新：
```
ALLOWED_ORIGINS=https://your-frontend-service.railway.app
```

### 6. 數據庫初始化

後端部署後會自動運行數據庫初始化和種子數據。

## 重要注意事項

### 安全配置
1. **更改默認管理員密碼**
2. **使用強JWT密鑰**
3. **配置正確的CORS來源**
4. **設置安全的Google OAuth重新導向URI**

### Google OAuth配置
在Google Cloud Console中添加Railway域名到授權來源：
- `https://your-frontend-service.railway.app`

### 域名設置（可選）
- 在Railway儀表板中可以設置自定義域名
- 更新環境變數中的域名引用

### 監控和日誌
- Railway提供內建的日誌和監控
- 可在儀表板中查看應用狀態和性能

## 故障排除

### 常見問題

1. **數據庫連接失敗**
   - 檢查DATABASE_URL是否正確設置
   - 確保PostgreSQL服務正在運行

2. **CORS錯誤**
   - 檢查ALLOWED_ORIGINS環境變數
   - 確保前端域名正確

3. **Google登錄失敗**
   - 檢查Google Client ID配置
   - 確保重新導向URI正確設置

4. **構建失敗**
   - 檢查Node.js版本兼容性
   - 確保所有依賴正確安裝

### 有用的Railway命令

```bash
# 查看服務狀態
railway status

# 查看日誌
railway logs

# 連接到數據庫
railway connect postgresql

# 重新部署
railway up

# 查看環境變數
railway variables
```