import { useState } from 'react'
import './Register.css'

function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit() {
    alert('Account created for ' + email)
  }

  return (
    <div className="register-container">
      <h1>Create an Account</h1>
      <div className="register-card">

        <div className="name-row">
          <div className="input-group">
            <label>First Name</label>
            <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="input-group">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="create-btn" onClick={handleSubmit}>Create Account</button>
        <button className="login-btn">Log In</button>

      </div>
    </div>
  )
}

export default Register