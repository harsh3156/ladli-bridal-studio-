import './Header.css'

interface HeaderProps {
  title?: string
}

export default function Header({ title = 'Ladli' }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">{title}</h1>
        <nav className="nav">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  )
}
