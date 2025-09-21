document.addEventListener('DOMContentLoaded', () => {
    
    // ---------------------------------------------------
    // --- CONFIGURACIÓN DEL BANNER (CARRUSEL HERO) ---
    // ---------------------------------------------------
    const heroMedia = [
        { 
            type: 'video', 
            src: 'videos/banner-video.mp4', 
            poster: 'imagenes/lampara-dahlia-gris.jpg'
        },
        { 
            type: 'video', 
            src: 'videos/banner-video3.mp4', 
            poster: 'imagenes/lampara-dahlia-gris.jpg'
        },
        { 
            type: 'video', 
            src: 'videos/banner-video2.mp4', 
            poster: 'imagenes/lampara-dahlia-gris.jpg'
        }
  //      { 
   //         type: 'image', 
    //        src: 'imagenes/lampara-dahlia-naranja.jpg' 
      //  },
       // { 
        //    type: 'image', 
         //   src: 'imagenes/percheros-cactus.jpg' 
        //}
    ];
    const slideDuration = 3000;

    // --- LÓGICA DEL CARRUSEL DEL BANNER ---
    const heroSlider = document.getElementById('hero-slider');
    let currentSlideIndex = 0;

    function initHeroSlider() {
        // Verificación: Solo se ejecuta si el contenedor del banner existe.
        if (!heroSlider || heroMedia.length === 0) return;

        heroMedia.forEach((media, index) => {
            const slide = document.createElement('div');
            slide.classList.add('hero__slide');
            if (media.type === 'video' && media.src) {
                slide.innerHTML = `<video playsinline autoplay muted loop poster="${media.poster || ''}"><source src="${media.src}" type="video/mp4"></video>`;
            } else if (media.type === 'image' && media.src) {
                slide.innerHTML = `<img src="${media.src}" alt="Imagen de fondo del banner">`;
            }
            if (index === 0) {
                slide.classList.add('active');
            }
            heroSlider.appendChild(slide);
        });

        if (heroMedia.length > 1) {
            setInterval(changeSlide, slideDuration);
        }
    }

    function changeSlide() {
        const slides = heroSlider.querySelectorAll('.hero__slide');
        if (slides.length <= 1) return;
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        const nextSlide = slides[currentSlideIndex];
        nextSlide.classList.add('active');
        const video = nextSlide.querySelector('video');
        if (video) {
            video.currentTime = 0;
            video.play().catch(error => console.log("Navegador impidió reproducción automática."));
        }
    }

    // --- EL RESTO DEL CÓDIGO CON VERIFICACIONES AÑADIDAS ---

    const productosGrid = document.getElementById('productos-grid');
    const filtrosCategoria = document.getElementById('filtros-categoria');
    const currentYearSpan = document.getElementById('current-year');
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show-menu');
            navToggle.classList.toggle('active');
        });
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach(link => link.addEventListener('click', () => {
            navMenu.classList.remove('show-menu');
            navToggle.classList.remove('active');
        }));
    }

    function mostrarProductos(productos) {
        if (!productosGrid) return;
        productosGrid.innerHTML = '';
        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = `producto-card categoria-${producto.categoria}`;
            let precioHTML = '';
            const formatoMoneda = { style: 'currency', currency: 'UYU' };
            if (producto.oferta && producto.precioOferta) {
                const precioOriginalF = producto.precioOriginal.toLocaleString('es-UY', formatoMoneda);
                const precioOfertaF = producto.precioOferta.toLocaleString('es-UY', formatoMoneda);
                precioHTML = `<span class="precio--original">${precioOriginalF}</span><span class="precio--oferta">${precioOfertaF}</span>`;
            } else {
                const precioNormalF = producto.precioOriginal.toLocaleString('es-UY', formatoMoneda);
                precioHTML = `<span class="precio--normal">${precioNormalF}</span>`;
            }
            card.innerHTML = `<div class="producto-card__imagen-cont"><img src="${producto.imagen}" alt="${producto.nombre}" class="producto-card__imagen">${producto.oferta ? '<span class="producto-card__oferta">Oferta</span>' : ''}</div><div class="producto-card__info"><span class="producto-card__categoria">${producto.categoria}</span><h3 class="producto-card__nombre">${producto.nombre}</h3><p class="producto-card__descripcion">${producto.descripcion}</p><div class="producto-card__footer"><div class="producto-card__precio">${precioHTML}</div><button class="boton producto-card__boton" data-nombre="${producto.nombre}">Me interesa</button></div></div>`;
            productosGrid.appendChild(card);
        });
    }

    if (filtrosCategoria && typeof catalogoLUMO !== 'undefined') {
        filtrosCategoria.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro')) {
                document.querySelector('.filtro.activo').classList.remove('activo');
                e.target.classList.add('activo');
                const categoria = e.target.dataset.categoria;
                const productosFiltrados = (categoria === 'todos') ? catalogoLUMO : catalogoLUMO.filter(p => p.categoria === categoria);
                mostrarProductos(productosFiltrados);
            }
        });
    }

    if (typeof catalogoLUMO !== 'undefined') {
        mostrarProductos(catalogoLUMO);
    }
    
    // --- LÓGICA DE MODALES (CORREGIDA Y ROBUSTA) ---
    const allModals = document.querySelectorAll('.modal');
    
    // Evento para el botón "Me interesa" de los productos
    if (productosGrid) {
        productosGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('producto-card__boton')) {
                const nombreProducto = e.target.dataset.nombre;
                const modalProducto = document.getElementById('modal-producto');
                if (modalProducto) { // Solo intenta abrir el modal si existe
                    modalProducto.querySelector('#modal-producto-nombre').textContent = nombreProducto;
                    modalProducto.querySelector('#producto-oculto').value = nombreProducto;
                    modalProducto.classList.add('visible');
                }
            }
        });
    }

    // Evento para el botón "Cotiza tu proyecto"
    const botonContacto = document.getElementById('boton-contacto-general');
    if (botonContacto) {
        botonContacto.addEventListener('click', () => {
            const modalContacto = document.getElementById('modal-contacto');
            if(modalContacto) modalContacto.classList.add('visible'); // Solo intenta abrir el modal si existe
        });
    }

    // Eventos para cerrar CUALQUIER modal
    allModals.forEach(modal => {
        const closeButton = modal.querySelector('.modal__cerrar');
        if (closeButton) {
            closeButton.addEventListener('click', () => modal.classList.remove('visible'));
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
            }
        });
    });

    // --- LÓGICA DE ENVÍO DE FORMULARIOS ---
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzE1vBjUfwxrqvpKjqMXEGgSwxz2mr-6G4gACG4Smh4IJEtKsaJsxN3eb_PAnoR5XaJ/exec"; 
    const handleFormSubmit = (formElement) => {
        if (!formElement) return;
        formElement.addEventListener('submit', e => {
            e.preventDefault();
            const submitButton = formElement.querySelector('button[type="submit"]');
            const messageElement = formElement.querySelector('.modal__mensaje-estado');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
            messageElement.textContent = '';
            fetch(SCRIPT_URL, { method: 'POST', body: new FormData(formElement) })
                .then(response => response.json())
                .then(data => {
                    if (data.result === 'success') {
                        messageElement.textContent = '¡Gracias! Hemos recibido tu mensaje.';
                        formElement.reset();
                        setTimeout(() => {
                            formElement.closest('.modal').classList.remove('visible');
                            messageElement.textContent = '';
                        }, 3000);
                    } else { throw new Error(data.message || 'Error desconocido.'); }
                })
                .catch(error => {
                    messageElement.textContent = 'Error al enviar. Intenta de nuevo.';
                    console.error('Error:', error);
                })
                .finally(() => {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                });
        });
    };
    handleFormSubmit(document.getElementById('form-producto'));
    handleFormSubmit(document.getElementById('form-contacto'));

    // --- INICIALIZAR FUNCIONES AL CARGAR LA PÁGINA ---
    initHeroSlider();
});