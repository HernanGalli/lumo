"use client";

import { useModal } from "@/components/public/modal-context";

export function AMedidaSection() {
  const { openContact } = useModal();

  return (
    <section
      id="a-medida"
      className="a-medida"
      style={{ backgroundImage: "url('/imagenes/medida.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="a-medida__contenedor contenedor">
        <h2 className="a-medida__titulo">
          ¿Tienes una idea? <br />
          La hacemos realidad.
        </h2>
        <p className="a-medida__parrafo">
          Desde prototipos funcionales hasta decoraciones personalizadas, convertimos tus
          conceptos en piezas tangibles con la precisión de la impresión 3D.
        </p>
        <button type="button" className="boton boton--blanco" onClick={openContact}>
          Cotiza tu Proyecto
        </button>
      </div>
    </section>
  );
}
