const PASOS = [
  { numero: 1, titulo: "Brief y Diseño", texto: "Nos contás tu proyecto y definimos el diseño." },
  { numero: 2, titulo: "Muestra y Aprobación", texto: "Fabricamos una muestra física para validar antes de producir." },
  { numero: 3, titulo: "Producción 3D", texto: "Imprimimos el volumen acordado con control de calidad." },
  { numero: 4, titulo: "Entrega Final", texto: "Coordinamos la entrega en los plazos definidos." },
];

export function ProcesoSteps() {
  return (
    <section className="contenedor py-16 md:py-20">
      <h2 className="titulo-seccion">Cómo trabajamos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {PASOS.map((paso) => (
          <div key={paso.numero} className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-azul text-white font-semibold">
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
