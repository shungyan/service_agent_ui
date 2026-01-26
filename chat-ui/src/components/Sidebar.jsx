import { useState, useRef, useEffect } from "react"
import "./Sidebar.css"

export default function Sidebar({ sessions, activeSession, onSelect, onCreate, onRename, onDelete }) {
  const [openDropdown, setOpenDropdown] = useState(null)
  const [isRenaming, setIsRenaming] = useState(null)
  const [renameValue, setRenameValue] = useState("")
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null)
        setIsRenaming(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleRenameClick(session) {
    setRenameValue(session.session_name)
    setIsRenaming(session.session_id)
    setOpenDropdown(null)
  }

  function submitRename(sessionId) {
    if (renameValue.trim()) {
      onRename(sessionId, renameValue.trim())
    }
    setIsRenaming(null)
  }

  function handleKeyDown(e, sessionId) {
    if (e.key === "Enter") {
      submitRename(sessionId)
    } else if (e.key === "Escape") {
      setIsRenaming(null)
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat-button" onClick={() => onCreate("New Chat")}>
          + New Chat
        </button>
      </div>

      <div className="sidebar-list" ref={dropdownRef}>
        {sessions.map(s => (
          <div
            key={s.session_id}
            className={`sidebar-item ${activeSession === s.session_id ? "active" : ""}`}
            onClick={() => {
              if (!isRenaming) onSelect(s.session_id)
            }}
          >
            {isRenaming === s.session_id ? (
              <input
                type="text"
                className="rename-input"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onBlur={() => submitRename(s.session_id)}
                onKeyDown={e => handleKeyDown(e, s.session_id)}
                autoFocus
              />
            ) : (
              <span className="session-name">{s.session_name}</span>
            )}

            {!isRenaming && (
              <div className="dropdown-container">
                <button
                  className="dropdown-toggle"
                  onClick={e => {
                    e.stopPropagation()
                    setOpenDropdown(openDropdown === s.session_id ? null : s.session_id)
                  }}
                >
                  ⋮
                </button>
                {openDropdown === s.session_id && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={e => {
                        e.stopPropagation()
                        handleRenameClick(s)
                      }}
                    >
                      Rename
                    </button>
                    <button
                      className="dropdown-item delete"
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(s.session_id)
                        setOpenDropdown(null)
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
