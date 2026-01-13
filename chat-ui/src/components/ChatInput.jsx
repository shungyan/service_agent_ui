import { useState } from "react"
import "./ChatInput.css"

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("")

  function send() {
    if (!text.trim()) return
    onSend(text)
    setText("")
  }

  return (
    <div className="chat-input">
      <input
        value={text}
        placeholder="Type message..."
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && send()}
      />
      <button onClick={send}>Send</button>
    </div>
  )
}
