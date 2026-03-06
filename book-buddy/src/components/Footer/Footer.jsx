import {useState, useEffect} from "react"
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
            <button className="footer_buttons">Home</button>
            {isUser ? ( 
                //Show when logged in
                <>
                    <button className="footer_buttons">Library</button>
                    <button className="footer_buttons">Messages</button>
                    <button className="footer_buttons">Requests</button>
                    <button className="footer_buttons" onClick={toggleUser}>Profile</button>
                </>
                ) : ( 
                //Show when logged in
                <>
                    <button className="footer_buttons" onClick={toggleUser}>Login</button>

                </>
                )
            }

        </div>
    </>
}

export default Footer;