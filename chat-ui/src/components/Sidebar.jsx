import { useState } from "react"
import "./Sidebar.css"

export default function Sidebar({ sessions, activeSession, onSelect, onCreate, onDelete }) {
  const [newName, setNewName] = useState("")

  function handleCreate() {
    if (!newName.trim()) return
    onCreate(newName.trim())
    setNewName("")
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <input
          className="sidebar-input"
          placeholder="New session..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCreate()}
        />
        <button onClick={handleCreate}>+</button>
      </div>

      <div className="sidebar-list">
        {sessions.map(s => (
          <div
            key={s.session_id}
            className={`sidebar-item ${activeSession === s.session_id ? "active" : ""}`}
            onClick={() => onSelect(s.session_id)}
          >
            <span>{s.session_name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(s.session_id)
              }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
