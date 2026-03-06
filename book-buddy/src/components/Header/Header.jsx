import React from "react";
import "./Header.css"

function Header() {
    return <>
        <div id="header">
            <h1 id="title">Explore Books</h1>
            <h2 id="subtitle">Discover books near you</h2>
            <div className="search_container">
                <img src="" id="search_icon"></img>
                <input type="text" id="search_bar" placeholder="Search books, authors, genres..."></input>
            </div>
        </div>
    </>
}

export default Header;