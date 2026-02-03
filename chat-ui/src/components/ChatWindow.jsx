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
          
          {/* 🔹 Render images ABOVE text */}
          {m.files?.length > 0 && (
            <div className="msg-images">
              {m.files
                .filter(f => f.type?.startsWith("image/"))
                .map((file, idx) => (
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
                ))}
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

