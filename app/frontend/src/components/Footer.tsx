import './Footer.css'

interface FooterProps {
  year?: number
}

export default function Footer({ year = new Date().getFullYear() }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Ladli</h3>
          <p>A modern React application built with Vite and TypeScript.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#github">GitHub</a></li>
            <li><a href="#docs">Documentation</a></li>
            <li><a href="#support">Support</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Connect</h4>
          <ul>
            <li><a href="#twitter">Twitter</a></li>
            <li><a href="#linkedin">LinkedIn</a></li>
            <li><a href="#email">Email</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} Ladli. All rights reserved.</p>
      </div>
    </footer>
  )
}
