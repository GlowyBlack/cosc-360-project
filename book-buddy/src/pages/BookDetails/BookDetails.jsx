import { useState } from 'react'
import Header from '../../components/Header/Header.jsx'
import './BookDetails.css'

function BookDetails() {
  const [activeTab, setActiveTab] = useState('About')

  const tabs = ['About', 'Reviews', 'Owner']

  return (
    <>
      <Header />

      <div className="book-image-banner">
        <img
          src="https://img.freepik.com/premium-vector/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available_87543-11093.jpg?w=2000"
          alt="Book cover"
          className="book-image"
        />
      </div>

      <div className="book-details-container">

        <h2 className="book-title">Book Title</h2>
        <p className="book-author">Book Author</p>

        <div className="tag-row">
          <span className="tag">Genre</span>
          <span className="tag">Condition</span>
        </div>

        <div className="availability-bar">
          <span className="dot"></span>
          <span>Available Now</span>
        </div>

        <div className="tab-row">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'tab active-tab' : 'tab'}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <hr />

        <div className="description-section">
          <p><strong>Description</strong></p>
          <p>Book description goes here.</p>
        </div>

        <div className="timeline-section">
          <p><strong>Availability Timeline</strong></p>
          <ul>
            <li>Timeline</li>
            <li>Timeline</li>
          </ul>
        </div>

        <div className="owner-card">
          <p><strong>Book Owner</strong></p>
          <div className="owner-row">
            <div className="profile-circle"></div>
            <span>@Username</span>
          </div>
          <p className="profile-label">Profile Picture</p>
        </div>

        <div className="borrow-btn-container">
          <button className="borrow-btn">Request to Borrow</button>
        </div>

      </div>
    </>
  )
}

export default BookDetails