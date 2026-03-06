import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Header from './components/Header/Header.jsx'
import AddNewBookForm from './components/AddNewBookForm.jsx'
import Register from './components/Register/Register.jsx'
import Footer from './components/Footer/Footer.jsx'


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <LoginForm/> */}
      <Header />
      <Register />
      <Footer />
    </>
  )
}

export default App
