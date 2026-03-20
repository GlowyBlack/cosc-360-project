import {useState, useEffect} from "react"
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import "./Footer.css"

function Footer(){
    const [isUser, setIsUser] = useState(false);



    function toggleUser(){
        setIsUser(!isUser);
    }

    useEffect(() => {
        console.log("Working")
    }, [isUser]);
    return <>
        <div id="footer" >
            <Link to="/">
            <button className="footer-buttons">Home</button>
            </Link>
            {isUser ? ( 
                //Show when logged in
                <>
                <Link to="/library">
                    <button className="footer-buttons">Library</button>
                </Link>
                    <button className="footer-buttons">Messages</button>
                    <button className="footer-buttons">Requests</button>
                    <button className="footer-buttons" onClick={toggleUser}>Profile</button>
                </>
                ) : ( 
                //Show when logged in
                <>  
                <Link to="">
                    <button className="footer-buttons" onClick={toggleUser}>Login</button>
                </Link>
                </>
                )
            }

        </div>
    </>
}

export default Footer;