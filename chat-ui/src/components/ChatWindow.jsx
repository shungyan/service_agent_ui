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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: (props) => (
                <img
                  {...props}
                  style={{ maxWidth: "50%", borderRadius: "6px" }}
                />
              ),
            }}
          >
            {normalizeBreaks(m.content)}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  )
}
