const mineflayer = require("mineflayer")
const express = require("express")

const app = express()
app.use(express.json())

let bot = null
let connecting = false
let logs = []

function addLog(msg) {
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`
  console.log(line)
  logs.push(line)
  if (logs.length > 300) logs.shift()
}

/* ---------- BOT ---------- */
function joinBot() {
  if (bot || connecting) {
    addLog("Join ignored (already online or connecting)")
    return
  }

  connecting = true
  addLog("Starting bot...")

  bot = mineflayer.createBot({
    host: "leztusasmp.xyz",
    username: "Xacrifizee_",
    version: false
  })

  bot.once("spawn", () => {
    connecting = false
    addLog("Bot spawned")

    setTimeout(() => bot.chat("/login <kurt>"), 3000)
    setTimeout(() => bot.chat("/server ecocpvp"), 6000)

    bot.jumpInterval = setInterval(() => {
      bot.setControlState("jump", true)
      setTimeout(() => bot.setControlState("jump", false), 200)
    }, 5000)
  })

  bot.on("chat", (u, m) => addLog(`<${u}> ${m}`))

  bot.on("end", () => {
    addLog("Bot disconnected")
    if (bot?.jumpInterval) clearInterval(bot.jumpInterval)
    bot = null
    connecting = false
  })

  bot.on("error", e => addLog("Error: " + e.message))
}

function leaveBot() {
  if (!bot) {
    addLog("Leave ignored (bot offline)")
    return
  }
  addLog("Bot leaving")
  if (bot.jumpInterval) clearInterval(bot.jumpInterval)
  bot.quit()
  bot = null
}

/* ---------- WEBSITE ---------- */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>AFK Bot Control</title>
  <style>
    body { background:#111;color:#0f0;font-family:monospace;padding:20px }
    button,input { padding:8px;margin:4px;background:#000;color:#0f0;border:1px solid #0f0 }
    #logs { height:300px;overflow:auto;background:#000;padding:10px;white-space:pre-wrap }
  </style>
</head>
<body>
  <h2>AFK Bot Control (Render)</h2>

  <button onclick="fetch('/join')">JOIN</button>
  <button onclick="fetch('/leave')">LEAVE</button><br>

  <input id="msg" placeholder="chat or command">
  <button onclick="send()">SEND</button>

  <div id="logs"></div>

<script>
async function send() {
  const m = msg.value
  msg.value = ""
  if (!m) return
  await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ message: m })
  })
}

async function loadLogs() {
  const r = await fetch("/logs")
  logs.textContent = await r.text()
  logs.scrollTop = logs.scrollHeight
}

setInterval(loadLogs, 1000)
loadLogs()
</script>
</body>
</html>
`)
})

app.get("/join", (req, res) => {
  joinBot()
  res.send("OK")
})

app.get("/leave", (req, res) => {
  leaveBot()
  res.send("OK")
})

app.post("/chat", (req, res) => {
  if (!bot) return res.send("Bot offline")
  bot.chat(req.body.message)
  addLog("You: " + req.body.message)
  res.send("OK")
})

app.get("/logs", (req, res) => {
  res.send(logs.join("\n"))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => addLog("Web server running on " + PORT))
