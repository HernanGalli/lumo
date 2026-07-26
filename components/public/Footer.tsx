export function Footer({ logoUrl }: { logoUrl: string | null }) {
  return (
    <footer id="contacto" className="footer">
      <div className="footer__contenedor contenedor">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo LUMO" className="footer__logo" />
        ) : (
          <p className="footer__logo" style={{ color: "var(--color-azul)", fontWeight: 600 }}>
            LUMO
          </p>
        )}
        <div className="footer__social">
          <a
            href="https://www.instagram.com/lumouy/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__social-link"
            aria-label="Instagram de LUMO"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61581194040211"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__social-link"
            aria-label="Facebook de LUMO"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
            </svg>
          </a>
          <a
            href="https://wa.me/59898753757"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__social-link"
            aria-label="WhatsApp de LUMO"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </a>
        </div>
        <p className="footer__texto">
          Llaveros personalizados para empresas, emprendimientos, escuelas y eventos. Hecho en
          Montevideo, Uruguay.
        </p>
        <p className="footer__contacto">
          © {new Date().getFullYear()} LUMO. Diseño e Impresión 3D. — Montevideo, Uruguay
        </p>
      </div>
    </footer>
  );
}
