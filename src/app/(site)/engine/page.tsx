export default function Engine() {
  return (
    <>
      <section style={{ display: "grid", gap: 10 }}>
        <p className="eyebrow">The engine behind Kavala</p>
        <h1>How Kavala works underneath</h1>
        <p className="lede">
          A digital daily game that turns nearby strangers into a small, trusted neighbourhood. This base version
          contains the engine underneath it: precise location that stays on the phone, neighbourhoods sized by
          people rather than distance, and in-person trust that can&apos;t be faked from afar.
        </p>
      </section>

      <section className="grid">
        <a className="card" href="/debug/location" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>Location engine</h2>
          <p className="muted">
            Reads your phone&apos;s GPS, filters bad fixes, picks the right hexagon size for its accuracy, and shows
            exactly what would be sent to the server: cell IDs only.
          </p>
        </a>
        <a className="card" href="/debug/hoods" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>Neighbourhoods</h2>
          <p className="muted">
            Groups synthetic residents around Kochi into neighbourhoods of 30 to 150 people. Dense areas get small
            hexagons; sparse areas get large ones.
          </p>
        </a>
        <a className="card" href="/debug/handshake" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>In-person handshake</h2>
          <p className="muted">
            A signed code that expires in 30 seconds, works once, and only passes when both phones are in the same
            place.
          </p>
        </a>
      </section>

      <section className="card">
        <h2>What this version does not do yet</h2>
        <p className="muted">
          No accounts or saved data on a server yet: the app experience keeps your progress in this browser and uses sample
          neighbours. Accounts and the database arrive in the next phase of the build guide. The location debug page needs HTTPS to read GPS on a phone, so test it on the Vercel link rather than
          over your home Wi-Fi address.
        </p>
      </section>
    </>
  );
}
