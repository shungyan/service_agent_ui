import { useState, useRef } from "react"
import "./ChatInput.css"

export default function ChatInput({ onSend }) {
  const [text, setText] = useState("")
  const [files, setFiles] = useState([]) // array of files
  const fileInputRef = useRef(null)

  function send() {
    if (!text.trim() && files.length === 0) return
    onSend(text, files)
    setText("")
    setFiles([])
    if (fileInputRef.current) fileInputRef.current.value = null
  }

  function handleFileChange(e) {
    if (e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)])
    }
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="chat-input">
      {/* File previews */}
      {files.length > 0 && (
        <div className="image-previews">
          {files.map((file, i) => {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
            const url = isPdf ? null : URL.createObjectURL(file)
            return (
              <div key={i} className="file-wrapper">
                {isPdf ? (
                  <div className="pdf-preview">📄 {file.name}</div>
                ) : (
                  <img src={url} alt={file.name} className="preview-img" />
                )}
                <button
                  className="remove-img-btn"
                  onClick={() => removeFile(i)}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="input-row">
        <button
          className="upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          +
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
          multiple
          accept="image/*,application/pdf" // allow images and PDFs
        />
        <input
          value={text}
          placeholder="Type message..."
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}
