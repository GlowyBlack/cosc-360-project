import { useState } from 'react'
import './Register.css'

function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [registering, setRegistering] = useState(true)

  function registerAccount() {
    alert('Account created for ' + email)
  }

  function login(){

  }

  function switchForm(){
    setRegistering(!registering)
  }

  return <>
    {registering ? ( 
      <div className="register-container">
        <h1>Create an Account</h1>
        <div className="form-card">

          <div className="name-row">
            <div className="input-group">
              <label>First Name</label>
              <input type="text" placeholder="Enter fist name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input type="text" placeholder="Enter last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password"  value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button className="create-btn" onClick={registerAccount}>Create Account</button>
          <button className="login-btn" onClick={switchForm}>Log In</button>

        </div>
      </div>
      ) : (
        <div className='register-container'>
          <h1>Login</h1>

          <div className="form-card">
            <div className="input-group">
              <label>Email</label>
              <input type="email" placeholder="Enter email" />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input type="password" placeholder="Enter password" />
            </div>

            <button className="login-btn" onClick={login}>Sign In</button>
            <button className="create-btn" onClick={switchForm}>Create a New Account</button>
          </div>
        </div>
      )
    }
  </>
}

export default Register