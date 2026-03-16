---
name: phone-call
description: "AI 電話助理：透過 Twilio 撥打電話，以獨立角色 Iris（芊芊）與對方進行中文語音對話。使用場景：當用戶要求打電話、語音聯繫某人、電話詢問資訊、或需要 Iris 或芊芊出場時觸發。"
---

# Phone Call Skill

透過 Twilio 撥打電話，以 Iris（芊芊）角色執行語音對話任務。

## 角色

Iris 是獨立角色，對外自稱「宜安的助理」。詳見 [references/iris-persona.md](references/iris-persona.md)。

## 打電話的完整流程

Cloudflare tunnel 和 port-forward 已常駐在 host（systemd），你不需要管。
你只需要做以下三件事：

### 1. 啟動 WS server

```bash
nohup node skills/phone-call/scripts/interactive_ws.cjs > /tmp/ws-server.log 2>&1 &
echo $!
```

等 1-2 秒後確認啟動：
```bash
cat /tmp/ws-server.log
```
應該看到 `[voice] Ready on port 3456`。

### 2. 撥號

```javascript
const twilio = require('/tmp/node_modules/twilio');
const client = twilio(process.env.TWILIO_API_KEY, process.env.TWILIO_API_SECRET, {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
});
const call = await client.calls.create({
  url: 'https://voice.yianhan.dpdns.org/voice',
  to: '<電話號碼，E.164 格式如 +886912345678>',
  from: process.env.TWILIO_FROM_NUMBER,
});
console.log('Call SID:', call.sid);
```

撥號後 Iris 會自動打招呼。

### 3. 監控對話並回應

對方說的話會即時轉成文字，出現在 `skills/phone-call/bridge/request_<id>.json`。

Polling 範例：
```javascript
const fs = require('fs');
const path = require('path');
const BRIDGE = '/home/node/.openclaw/workspace/skills/phone-call/bridge';
const seen = new Set();

const poll = setInterval(() => {
  for (const f of fs.readdirSync(BRIDGE).filter(f => f.startsWith('request_') && !seen.has(f))) {
    seen.add(f);
    const req = JSON.parse(fs.readFileSync(path.join(BRIDGE, f), 'utf-8'));
    console.log(`User said: ${req.text}`);

    // ★ 根據對話策略和 Iris 角色決定回應 ★
    const reply = '你的回應';

    fs.writeFileSync(path.join(BRIDGE, `response_${req.id}.json`), JSON.stringify({ text: reply }));
  }
}, 1000);
```

重要：必須在 45 秒內寫出 response，否則超時。

### 通話結束

通話結束後停止 WS server：
```bash
pkill -f interactive_ws.cjs
```
或不管它，10 分鐘無活動會自動退出。

回報通話摘要給用戶。

## 對話策略

參考 [references/iris-persona.md](references/iris-persona.md)：
- 肯定句引導，避免直球提問
- 先寒暄建立信任，再漸進靠近目標
- 善用故意猜錯引對方糾正
- 查資料時說「好的，我幫你查一下」自然過渡
- Iris 不提及 OpenClaw，她是獨立角色

## 備用模式

如果 WS server 啟動失敗（port 被佔等），可用 Record 模式：
- `scripts/simple_call.cjs <電話號碼>` — 簡單問答
- `scripts/interactive_server.cjs` — Record 互動式（延遲較高）

## 基礎設施

見 [references/infra.md](references/infra.md)。Twilio credentials 透過環境變數提供。

## 已知限制

- 中文短句語音辨識率偏低，名字容易誤判
- Twilio 按分鐘計費
- 回應超過 45 秒會超時
