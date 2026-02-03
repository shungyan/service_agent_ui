import "./ChatWindow.css"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function normalizeBreaks(text) {
  return text.replace(/<br\s*\/?>/gi, "\n")
}

export default function ChatWindow({ messages }) {
  return (
    <div className="chat-window">
      {messages.map((m, i) => (
        <div key={i} className={`bubble ${m.role}`}>
          
          {/* 🔹 Render files ABOVE text */}
          {m.files?.length > 0 && (
            <div className="msg-files">
              {m.files.map((file, idx) => {
                const isPdf = file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')
                
                if (isPdf) {
                  return (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pdf-link"
                      download={file.name}
                    >
                      📄 {file.name}
                    </a>
                  )
                }
                
                return (
                  <img
                    key={idx}
                    src={file.url}
                    alt={file.name}
                    className="msg-image"
                    onError={(e) => {
                      // Handle broken blob URLs by showing error state
                      e.target.style.display = 'none'
                      console.error('Failed to load image:', file.url)
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* 🔹 Markdown text */}
          {m.content && (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: props => (
                  <img
                    {...props}
                    style={{ maxWidth: "50%", borderRadius: "6px" }}
                  />
                ),
              }}
            >
              {normalizeBreaks(m.content)}
            </ReactMarkdown>
          )}
        </div>
      ))}
    </div>
  )
}

