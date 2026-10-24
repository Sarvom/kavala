/** Layout for the engine and debug pages: a simple site header and footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <a href="/" className="wordmark">Kavala</a>
        <nav aria-label="Main">
          <a href="/">Play</a>
          <a href="/engine">Engine</a>
          <a href="/debug/location">Location</a>
          <a href="/debug/hoods">Neighbourhoods</a>
          <a href="/debug/handshake">Handshake</a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="foot">Your friendly neighbourhood · maps &copy; OpenStreetMap contributors</footer>
    </div>
  );
}
