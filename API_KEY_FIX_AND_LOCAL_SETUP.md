# 🔧 API Key Validation Fix and Local Server Setup

## 🎯 API Key Validation Issue Analysis

### **Problem Location:**
The "Invalid API Key" error occurs in the frontend validation at:
`extension/utils/config.js` line 168

### **Current Validation Pattern:**
```javascript
openai: /^sk-[a-zA-Z0-9]{32,}$/
```

### **Issue:**
This regex expects exactly 32+ alphanumeric characters after "sk-", but modern OpenAI API keys can vary in length and format.

## ✅ Fix 1: Updated API Key Validation

### **Corrected Pattern:**
```javascript
openai: /^sk-[a-zA-Z0-9]{32,}$/  // Current (too restrictive)
// Should be:
openai: /^sk-[a-zA-Z0-9_-]{20,}$/  // More flexible
```

### **Apply the Fix:**
1. Open `extension/utils/config.js`
2. Find line 168
3. Replace the OpenAI pattern with the corrected version above

## 🚀 Fix 2: Local Server Setup for Testing

### **Option A: Quick Local Setup**

1. **Navigate to backend directory:**
```cmd
cd backend
```

2. **Install dependencies:**
```cmd
pip install -r requirements.txt
```

3. **Create .env file:**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-2C5A936B7A5512526F
```

4. **Run local server:**
```cmd
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### **Option B: Docker Setup (Recommended)**

1. **Build Docker image:**
```cmd
cd backend
docker build -t arabic-subs-backend .
```

2. **Run container:**
```cmd
docker run -p 8000:8000 -e EMERGENT_LLM_KEY=sk-emergent-2C5A936B7A5512526F arabic-subs-backend
```

## 🛠️ Configuration Steps

### **1. Update Extension to Use Local Backend:**

1. **Open extension popup**
2. **Go to "Backend Configuration"**
3. **Select "Local Server"**
4. **Test connection** - should show success

### **2. API Key Testing:**

1. **In popup, select "OpenAI" as provider**
2. **Enter a valid OpenAI key** (starts with `sk-`)
3. **Click "Save"**
4. **Should now pass validation**

### **3. Verify Everything Works:**

1. **Open any video page**
2. **Click extension icon**
3. **Click "Start Capture"**
4. **Speak or play audio**
5. **Watch for subtitles in Arabic**

## 📋 Troubleshooting

### **If Still Getting "Invalid API Key":**
1. Check that your key starts with `sk-`
2. Verify key length (should be 51+ characters typically)
3. Ensure no extra spaces or characters

### **If Local Server Won't Start:**
1. Check if port 8000 is already in use
2. Verify MongoDB is running (or use in-memory DB)
3. Check .env file configuration

### **If Translation Not Working:**
1. Check backend logs for errors
2. Verify EMERGENT_LLM_KEY is properly configured
3. Test API connectivity in debug panel

## 🔧 Quick Debug Commands

### **Check Extension Logs:**
1. Open extension popup
2. Click debug icon (🔧)
3. Check "Recent Logs" section

### **Test Backend Directly:**
```cmd
curl http://localhost:8000/api/
```

### **Check API Key Format:**
Your OpenAI key should look like:
`sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🎉 Expected Results

After applying these fixes:
✅ API key validation should pass
✅ Local backend should accept connections
✅ Translation should work with your own keys
✅ Extension becomes completely self-contained

Would you like me to apply the API key validation fix to your config.js file now?