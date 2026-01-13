import { useEffect, useState } from "react"
import Sidebar from "./components/Sidebar"
import "./App.css"
import ChatWindow from "./components/ChatWindow"
import ChatInput from "./components/ChatInput"

const BASE_URL = "http://localhost:4896"

export default function App() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [historyCache, setHistoryCache] = useState({})

  function normalizeMessage(m) {
  if (!m) return null

  return {
    role: m.role === "assistant" ? "agent" : m.role,
    content: m.content || m.message || m.text || ""
  }
}

  function loadHistory(sessionId) {
    if (historyCache[sessionId]) {
      setMessages(historyCache[sessionId])
      return
    }

    fetch(`${BASE_URL}/sessions/${sessionId}?type=agent`)
      .then(r => r.json())
      .then(data => {
        const history = (data.chat_history || [])
        .map(normalizeMessage)
        .filter(Boolean)
        setHistoryCache(c => ({ ...c, [sessionId]: history }))
        setMessages(history)
      })
  }


  function selectSession(id) {
    setActiveSession(id)
    loadHistory(id)
  }


  
async function sendMessage(text) {
  if (!activeSession || activeSession.startsWith("tmp-")) return

  const userMsg = { role: "user", content: text }
  setMessages(m => [...m, userMsg])

  const res = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: activeSession, message: text })
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  let agentMsg = { role: "agent", content: "" }
  setMessages(m => [...m, agentMsg])

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    agentMsg.content += chunk

    setMessages(m => {
      const copy = [...m]
      copy[copy.length - 1] = { ...agentMsg }
      return copy
    })
  }
}

  useEffect(() => {
    if (sessions.length === 0) {
      setActiveSession(null)
      setMessages([])
    }
  }, [sessions])


  // useEffect(() => {
  //   setMessages([])
  // }, [activeSession])

  function loadSessions() {
    fetch(`${BASE_URL}/sessions?type=agent`)
      .then(r => r.json())
      .then(json => setSessions(json.data || []))
      .catch(console.error)
  }

  useEffect(() => {
    loadSessions()
  }, [])

  function createSession(name) {
    const tempId = "tmp-" + Date.now()

    const optimisticSession = {
      session_id: tempId,
      session_name: name,
      _optimistic: true
    }

    setSessions(s => [optimisticSession, ...s])
    setActiveSession(tempId)

    fetch(`${BASE_URL}/sessions?type=agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_name: name })
    })
      .then(r => r.json())
      .then(real => {
        setSessions(s =>
          s.map(x => x.session_id === tempId ? real : x)
        )
        setActiveSession(real.session_id)  
      })
      .catch(() => {
        setSessions(s => s.filter(x => x.session_id !== tempId))
      })
  }


  function deleteSession(id) {
    const snapshot = sessions

    setSessions(s => s.filter(x => x.session_id !== id))

    if (activeSession === id) {
      setActiveSession(null)
      setMessages([])
    }

    fetch(`${BASE_URL}/sessions/${id}`, { method: "DELETE" })
      .catch(() => setSessions(snapshot))

    setHistoryCache(c => {  
      const copy = { ...c }
      delete copy[id]
      return copy
    })
  }


  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        activeSession={activeSession}
        onSelect={selectSession}
        onCreate={createSession}
        onDelete={deleteSession}
      />
      <div className="chat-area">
        {activeSession ? (
          <>
            <ChatWindow messages={messages} />
            <ChatInput onSend={sendMessage} />
          </>
        ) : (
          <div className="chat-placeholder">Select a session</div>
        )}
      </div>
    </div>
  )
}
