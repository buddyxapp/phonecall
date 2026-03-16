---
name: phone-call
description: "打電話給某人，讓芊芊執行語音對話任務"
---

# Phone Call

## 流程

### 1. 啟動
```bash
nohup node skills/phone-call/scripts/interactive_ws.cjs "<任務描述>" > /tmp/ws-server.log 2>&1 &
```
範例：`"問對方明早想吃什麼"`

### 2. 撥號
```javascript
const twilio = require('/tmp/node_modules/twilio');
const client = twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, { accountSid: process.env.TWILIO_ACCOUNT_SID });
await client.calls.create({ url: 'https://voice.example.com/voice', to: '<+886...>', from: process.env.TWILIO_FROM_NUMBER });
```

### 3. 監控（可選）
芊芊自己能聊。只有她問你查資料時才需介入：
```bash
node skills/phone-call/scripts/bridge.cjs poll --wait 120
```
收到 JSON 就查資料，然後 `bridge.cjs reply <id> <結果>`。

### 4. 結束
```bash
cat skills/phone-call/bridge/call_log.json  # 對話紀錄
pkill -f interactive_ws.cjs
```
