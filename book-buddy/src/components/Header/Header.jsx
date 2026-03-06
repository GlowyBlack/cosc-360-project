import "./Header.css"
function Header() {
    return <>
        <div id="header">
            <h2 id="title">Explore Books</h2>
            <p id="subtitle">Discover books near you</p>
            <div className="search_container">
                <img src="" id="search_icon"></img>
                <input type="text" id="search_bar" placeholder="Search books, authors, genres..."></input>
            </div>
        </div>
    </>
}

export default Header;