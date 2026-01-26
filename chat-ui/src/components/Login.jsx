import { useState } from "react"
import "./Login.css"

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    
    try {
      if (isRegister) {
        await onRegister(email, password)
      } else {
        await onLogin(email, password)
      }
    } catch (err) {
      setError(err.message || "Authentication failed")
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
        <p className="login-subtitle">
          {isRegister ? "Sign up to start chatting" : "Sign in to continue"}
        </p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          
          {error && <div className="login-error">{error}</div>}
          
          <button type="submit" className="login-button">
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>
        
        <div className="login-toggle">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button onClick={() => setIsRegister(false)}>Sign In</button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button onClick={() => setIsRegister(true)}>Create One</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
