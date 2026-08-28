import "./globals.css";
import { IdentityProvider } from "../lib/IdentityContext";
import Nav from "../components/Nav";

export const metadata = {
  title: "Technocore Creator Portal",
  description: "Buat identitas, check-in, dan submit kontribusi ke Technocore — tanpa terminal.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <IdentityProvider>
          <div className="shell">
            <header className="topbar">
              <div className="brand">
                <span className="pulse" aria-hidden="true" />
                <span>Technocore Creator Portal</span>
              </div>
              <p className="disclaimer">Alat komunitas independen — bukan produk resmi FLOP Labs.</p>
            </header>
            <main className="content">{children}</main>
            <Nav />
          </div>
        </IdentityProvider>
      </body>
    </html>
  );
}
