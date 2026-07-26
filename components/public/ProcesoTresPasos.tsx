const PASOS = [
  {
    numero: 1,
    titulo: "Mandás tu idea o escudo",
    texto: "Un logo, un escudo, una foto de referencia — lo que tengas nos sirve para arrancar.",
  },
  {
    numero: 2,
    titulo: "Te armamos el 3D",
    texto: "Modelamos la pieza y te mandamos una previsualización antes de producir nada.",
  },
  {
    numero: 3,
    titulo: "A la cancha",
    texto: "Producción y entrega prolija, en los volúmenes que necesites.",
  },
];

export function ProcesoTresPasos() {
  return (
    <section id="proceso" className="contenedor py-16 md:py-20 scroll-mt-20">
      <h2 className="titulo-seccion">El proceso en 3 pasos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PASOS.map((paso) => (
          <div
            key={paso.numero}
            className="rounded-lg border border-border bg-surface p-6 text-center transition-colors hover:border-cian"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-azul text-white font-semibold text-lg">
              {paso.numero}
            </div>
            <h3 className="font-medium mb-2">{paso.titulo}</h3>
            <p className="text-sm text-foreground-muted">{paso.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
