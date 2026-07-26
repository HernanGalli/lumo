// Se ejecuta antes de la hidratación para evitar un flash del tema equivocado.
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("lumo-theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
