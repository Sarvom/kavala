/** Layout for the engine and debug pages: a simple site header and footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <a href="/" className="wordmark"><img className="logo-on-light" src="/brand/kavala-mark-light.webp" alt="" width={34} height={34} /><img className="logo-on-dark" src="/brand/kavala-mark-dark.webp" alt="" width={34} height={29} />Kavala</a>
        <nav aria-label="Main">
          <a href="/">Play</a>
          <a href="/engine">Engine</a>
          <a href="/debug/location">Location</a>
          <a href="/debug/hoods">Neighbourhoods</a>
          <a href="/debug/handshake">Handshake</a>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="foot"><img className="logo-on-light" src="/brand/trying-to-do-better-mark-light.webp" alt="" width={28} height={28} /><img className="logo-on-dark" src="/brand/trying-to-do-better-mark-dark.webp" alt="" width={28} height={28} />Kavala by Trying to Do Better · maps &copy; OpenStreetMap contributors</footer>
    </div>
  );
}
