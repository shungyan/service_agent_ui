import { useEffect, useState, useRef, useCallback } from "react"
import PocketBase from "pocketbase"
import Sidebar from "./components/Sidebar"
import Login from "./components/Login"
import "./App.css"
import ChatWindow from "./components/ChatWindow"
import ChatInput from "./components/ChatInput"

const POCKETBASE_URL = "http://localhost:8090"
const API_URL = "http://localhost:4896"

export default function App() {
  const [pb, setPb] = useState(null)
  const [user, setUser] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const pocketbase = new PocketBase(POCKETBASE_URL)
    setPb(pocketbase)
    
    pocketbase.authStore.loadFromCookie(document.cookie)
    
    pocketbase.authStore.onChange(() => {
      document.cookie = pocketbase.authStore.exportToCookie({ httpOnly: false })
      setUser(pocketbase.authStore.model)
    })
    
    if (pocketbase.authStore.isValid) {
      setUser(pocketbase.authStore.model)
    } 
  }, [])

  async function login(email, password) {
    pb.autoCancellation(false);
    await pb.collection("users").authWithPassword(email, password)
  }

  async function register(email, password) {
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password
    })
    await pb.collection("users").authWithPassword(email, password)
  }

  function logout() {
    pb.authStore.clear()
    setUser(null)
    setSessions([])
    setActiveSession(null)
    setMessages([])
  }

function normalizeMessage(m) {
  if (!m) return null
  return {
    role: m.role === "assistant" ? "llm" : m.role,
    content: m.content || m.message || m.text || "",
    files: m.files || [],
    timestamp: m.timestamp || new Date().toISOString()
  }
}

async function uploadFilesToPocketBase(files) {
  if (!pb || files.length === 0) return []

  const uploadedFiles = []
  for (const file of files) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user', user.id)

      const record = await pb.collection('files').create(formData)

      // Get the file URL from PocketBase
      const fileUrl = `${POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${record.file}`

      uploadedFiles.push({
        name: file.name,
        type: file.type,
        url: fileUrl,
        recordId: record.id
      })
    } catch (err) {
      console.error('Failed to upload file:', err)
      // Fallback to temporary URL if upload fails
      uploadedFiles.push({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file)
      })
    }
  }
  return uploadedFiles
}

async function loadHistory(sessionId) {
    try {
      const session = await pb.collection("sessions").getOne(sessionId)
      const history = (session.messages || [])
        .map(normalizeMessage)
        .filter(Boolean)
      setMessages(history)
    } catch (err) {
      console.error("Failed to load history:", err)
      setMessages([])
    }
  }

  async function selectSession(id) {
    setActiveSession(id)
    await loadHistory(id)
  }

  async function appendMessageToSession(sessionId, message) {
    try {
      const session = await pb.collection("sessions").getOne(sessionId)
      const currentMessages = session.messages || []
      const updatedMessages = [...currentMessages, message]
      
      await pb.collection("sessions").update(sessionId, {
        messages: updatedMessages
      })
      
      return updatedMessages
    } catch (err) {
      console.error("Failed to append message:", err)
      throw err
    }
  }

  async function sendMessage(text, files = []) {
    if (!activeSession || !pb) return

    const isFirstMessage = messages.length === 0

    // Upload files to PocketBase first
    let uploadedFiles = []
    if (files.length > 0) {
      // Show temporary preview immediately
      const tempFiles = files.map(file => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        isTemporary: true
      }))

      const userMsgTemp = {
        role: "user",
        content: text,
        files: tempFiles,
        timestamp: new Date().toISOString()
      }
      setMessages(m => [...m, userMsgTemp])

      // Upload files to PocketBase
      uploadedFiles = await uploadFilesToPocketBase(files)

      // Update message with permanent URLs
      const userMsg = {
        role: "user",
        content: text,
        files: uploadedFiles,
        timestamp: new Date().toISOString()
      }

      // Replace the temporary message with the permanent one
      setMessages(m => {
        const newMessages = [...m]
        newMessages[newMessages.length - 1] = userMsg
        return newMessages
      })

      await appendMessageToSession(activeSession, userMsg)
    } else {
      const userMsg = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString()
      }
      setMessages(m => [...m, userMsg])
      await appendMessageToSession(activeSession, userMsg)
    }

    if (isFirstMessage) {
      const truncatedName = text.length > 30 ? text.substring(0, 30) + "..." : text
      await pb.collection("sessions").update(activeSession, {
        session_name: truncatedName
      })
      setSessions(s =>
        s.map(x => x.session_id === activeSession ? { ...x, session_name: truncatedName } : x)
      )
    }

    try {
      const session = await pb.collection("sessions").getOne(activeSession)

      // ✅ Use FormData for multipart/form-data
      const formData = new FormData()
      formData.append("message", text)
      formData.append("stream", "true")
      formData.append("session_id", session.agno_session_id)

      // ✅ append file if exists
      files.forEach(file => {
        formData.append("files", file)
      })
      
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        body: formData // note: no Content-Type header! browser sets it automatically
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let agentMsg = { role: "llm", content: "Thinking…", timestamp: new Date().toISOString() }
      let firstChunk = true

      setMessages(m => [...m, agentMsg])

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        if (firstChunk) {
          agentMsg.content = ""
          firstChunk = false
        }

        agentMsg.content += chunk

        setMessages(m => {
          const copy = [...m]
          copy[copy.length - 1] = { ...agentMsg }
          return copy
        })
      }

      await appendMessageToSession(activeSession, agentMsg)
    } catch (err) {
      console.error("Chat error:", err)
      const errorMsg = { role: "llm", content: "Sorry, something went wrong.", timestamp: new Date().toISOString() }
      setMessages(m => [...m, errorMsg])
      await appendMessageToSession(activeSession, errorMsg)
    }
  }

  const loadSessions = useCallback(async () => {
    if (!pb || !user) return
    
    try {
      const result = await pb.collection("sessions").getList(1, 50, {
        sort: "-created",
        filter: `user = "${user.id}"`
      })
      setSessions(result.items.map(item => ({
        session_id: item.id,
        session_name: item.session_name || `Session ${item.id.slice(0, 8)}`,
        agno_session_id: item.agno_session_id,
        messages: item.messages
      })))
    } catch (err) {
      console.error("Failed to load sessions:", err)
    }
  }, [pb, user])

  useEffect(() => {
    if (user && pb) {
      loadSessions()
    }
  }, [user, pb, loadSessions])

  async function createSession() {
    if (!pb || !user) return

    const tempId = "tmp-" + Date.now()
    const agnoSessionId = `agno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const sessionName = "New Chat"

    const optimisticSession = {
      session_id: tempId,
      session_name: sessionName,
      agno_session_id: agnoSessionId,
      _optimistic: true
    }

    setSessions(s => [optimisticSession, ...s])
    setActiveSession(tempId)

    try {
      const real = await pb.collection("sessions").create({
        session_name: sessionName,
        user: user.id,
        agno_session_id: agnoSessionId,
        messages: []
      })

      setSessions(s =>
        s.map(x => x.session_id === tempId ? {
          session_id: real.id,
          session_name: real.session_name || sessionName,
          agno_session_id: real.agno_session_id,
          messages: real.messages
        } : x)
      )
      setActiveSession(real.id)
      setMessages([])
    } catch (err) {
      console.error("Failed to create session:", err)
      setSessions(s => s.filter(x => x.session_id !== tempId))
      if (activeSession === tempId) {
        setActiveSession(null)
      }
    }
  }

  async function deleteSession(id) {
    if (!pb) return

    const snapshot = sessions

    setSessions(s => s.filter(x => x.session_id !== id))

    if (activeSession === id) {
      setActiveSession(null)
      setMessages([])
    }

    try {
      await pb.collection("sessions").delete(id)
    } catch (err) {
      console.error("Failed to delete session:", err)
      setSessions(snapshot)
    }
  }

  async function renameSession(id, newName) {
    if (!pb) return

    const previousName = sessions.find(s => s.session_id === id)?.session_name

    setSessions(s =>
      s.map(x => x.session_id === id ? { ...x, session_name: newName } : x)
    )

    try {
      await pb.collection("sessions").update(id, {
        session_name: newName
      })
    } catch (err) {
      console.error("Failed to rename session:", err)
      setSessions(s =>
        s.map(x => x.session_id === id ? { ...x, session_name: previousName } : x)
      )
    }
  }

  if (!user) {
    return <Login onLogin={login} onRegister={register} />
  }

  return (
    <div className="app">
      <div className="app-header">
        <div className="user-info">
          <span className="user-email">{user.email}</span>
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>
      <div className="app-body">
        <Sidebar
          sessions={sessions}
          activeSession={activeSession}
          onSelect={selectSession}
          onCreate={createSession}
          onRename={renameSession}
          onDelete={deleteSession}
        />
        <div className="chat-area">
          {activeSession ? (
            <>
              <ChatWindow messages={messages} />
              <ChatInput onSend={sendMessage} />
            </>
          ) : (
            <div className="chat-placeholder">Select a session to start chatting</div>
          )}
        </div>
      </div>
    </div>
  )
}
