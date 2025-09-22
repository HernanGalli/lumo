document.addEventListener('DOMContentLoaded', () => {
    
    // --- CONFIGURACIÓN Y CONSTANTES ---
    const heroMedia = [
        { type: 'video', src: 'videos/banner-video.mp4', poster: 'imagenes/lampara-dahlia-gris.jpg'},
        { type: 'video', src: 'videos/banner-video3.mp4', poster: 'imagenes/lampara-dahlia-gris.jpg'},
        { type: 'video', src: 'videos/banner-video2.mp4', poster: 'imagenes/lampara-dahlia-gris.jpg'}
    ];
    const slideDuration = 3000;
    const PRODUCTOS_A_MOSTRAR_INICIALMENTE = 3; // Mostrar 3 productos completos

    // --- ELEMENTOS DEL DOM ---
    const catalogoSection = document.getElementById('catalogo');
    const heroSlider = document.getElementById('hero-slider');
    const productosGrid = document.getElementById('productos-grid');
    const filtrosCategoria = document.getElementById('filtros-categoria');
    const verMasBtn = document.getElementById('ver-mas-btn');
    const verMasContenedor = document.querySelector('.ver-mas__contenedor');
    const currentYearSpan = document.getElementById('current-year');
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    const botonContactoHero = document.getElementById('boton-contacto-hero');
    const botonContactoGeneral = document.getElementById('boton-contacto-general');

    let productosFiltradosActuales = (typeof catalogoLUMO !== 'undefined') ? [...catalogoLUMO] : [];

    // --- LÓGICA DEL CARRUSEL DEL BANNER ---
    function initHeroSlider() {
        if (!heroSlider || heroMedia.length === 0) return;
        let currentSlideIndex = 0;
        heroMedia.forEach((media, index) => {
            const slide = document.createElement('div');
            slide.classList.add('hero__slide');
            if (media.type === 'video' && media.src) {
                slide.innerHTML = `<video playsinline autoplay muted loop poster="${media.poster || ''}"><source src="${media.src}" type="video/mp4"></video>`;
            } else if (media.type === 'image' && media.src) {
                slide.innerHTML = `<img src="${media.src}" alt="Imagen de fondo del banner">`;
            }
            if (index === 0) slide.classList.add('active');
            heroSlider.appendChild(slide);
        });
        if (heroMedia.length > 1) {
            setInterval(() => {
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
            }, slideDuration);
        }
    }

    // --- LÓGICA GENERAL DE LA PÁGINA ---
    if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
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

    // --- LÓGICA DEL CATÁLOGO Y "VER MÁS" ---
    function mostrarProductos(productos) {
        if (!productosGrid) return;
        productosGrid.innerHTML = '';
        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = `producto-card categoria-${producto.categoria}`;
            let imagesHTML = '';
            const imagenes = producto.imagenes || [];
            imagenes.forEach((imgSrc, idx) => {
                imagesHTML += `<img src="${imgSrc}" alt="${producto.nombre}" class="card-gallery__image ${idx === 0 ? 'active' : ''}">`;
            });
            let navButtonsHTML = '';
            if (imagenes.length > 1) {
                navButtonsHTML = `<button class="card-gallery__nav card-gallery__nav--prev" aria-label="Anterior">&#10094;</button><button class="card-gallery__nav card-gallery__nav--next" aria-label="Siguiente">&#10095;</button>`;
            }
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
            card.innerHTML = `<div class="producto-card__imagen-cont"><div class="card-gallery">${imagesHTML}</div>${navButtonsHTML}${producto.oferta ? `<span class="producto-card__oferta">Oferta</span>` : ''}</div><div class="producto-card__info"><span class="producto-card__categoria">${producto.categoria}</span><h3 class="producto-card__nombre">${producto.nombre}</h3><p class="producto-card__descripcion">${producto.descripcion}</p><div class="producto-card__footer"><div class="producto-card__precio">${precioHTML}</div><button class="boton producto-card__boton" data-nombre="${producto.nombre}">Me interesa</button></div></div>`;
            productosGrid.appendChild(card);
        });
    }

    function gestionarVistaCatalogo() {
        if (!catalogoSection || !verMasContenedor || !productosGrid) return;

        const productosVisibles = productosFiltradosActuales.length;
        const primerProducto = productosGrid.querySelector('.producto-card');

        // Si hay más productos que el límite inicial y tenemos al menos un producto para medir
        if (productosVisibles > PRODUCTOS_A_MOSTRAR_INICIALMENTE && primerProducto) {
            catalogoSection.classList.add('catalogo--collapsed');
            verMasContenedor.classList.remove('hidden');
            
            const cardHeight = primerProducto.offsetHeight;
            const gridGap = parseInt(getComputedStyle(productosGrid).gap) || 30; // 30px es 3rem
            
            // Regla: 3 productos completos y la mitad del cuarto (en vista de 1 columna)
            const alturaDeseada = (cardHeight * 3) + (gridGap * 2) + (cardHeight / 2) + gridGap;
            productosGrid.style.maxHeight = `${alturaDeseada}px`;
        } else {
            // Si hay menos productos, nos aseguramos de que se vea todo normal
            catalogoSection.classList.remove('catalogo--collapsed');
            verMasContenedor.classList.add('hidden');
            productosGrid.style.maxHeight = null;
        }
    }

    if (verMasBtn) {
        verMasBtn.addEventListener('click', () => {
            // --- CORRECCIÓN CLAVE AQUÍ ---
            // Al hacer clic, quitamos la clase que aplica el efecto y la altura máxima.
            if (catalogoSection) catalogoSection.classList.remove('catalogo--collapsed');
            if (verMasContenedor) verMasContenedor.classList.add('hidden');
            if (productosGrid) productosGrid.style.maxHeight = null; // Esto permite que el contenedor crezca a su altura total
        });
    }

    if (filtrosCategoria) {
        filtrosCategoria.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro')) {
                document.querySelector('.filtro.activo').classList.remove('activo');
                e.target.classList.add('activo');
                const categoria = e.target.dataset.categoria;
                productosFiltradosActuales = (categoria === 'todos') ? catalogoLUMO : catalogoLUMO.filter(p => p.categoria === categoria);
                mostrarProductos(productosFiltradosActuales);
                // Esperamos un instante para que el navegador dibuje los productos antes de medir su altura
                setTimeout(gestionarVistaCatalogo, 50); 
            }
        });
    }
    
    // --- LÓGICA DE EVENTOS (MODALES Y GALERÍA) ---
    if (productosGrid) {
        productosGrid.addEventListener('click', (e) => {
            const navButton = e.target.closest('.card-gallery__nav');
            const interestButton = e.target.closest('.producto-card__boton');
            if (navButton) {
                const gallery = navButton.closest('.producto-card__imagen-cont').querySelector('.card-gallery');
                const images = gallery.querySelectorAll('.card-gallery__image');
                let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
                images[currentIndex].classList.remove('active');
                if (navButton.classList.contains('card-gallery__nav--next')) {
                    currentIndex = (currentIndex + 1) % images.length;
                } else {
                    currentIndex = (currentIndex - 1 + images.length) % images.length;
                }
                images[currentIndex].classList.add('active');
            } else if (interestButton) {
                const nombreProducto = interestButton.dataset.nombre;
                const modalProducto = document.getElementById('modal-producto');
                if (modalProducto) {
                    modalProducto.querySelector('#modal-producto-nombre').textContent = nombreProducto;
                    modalProducto.querySelector('#producto-oculto').value = nombreProducto;
                    modalProducto.classList.add('visible');
                }
            }
        });
    }
    function abrirModalContacto() {
        const modalContacto = document.getElementById('modal-contacto');
        if(modalContacto) modalContacto.classList.add('visible');
    }
    if (botonContactoHero) botonContactoHero.addEventListener('click', abrirModalContacto);
    if (botonContactoGeneral) botonContactoGeneral.addEventListener('click', abrirModalContacto);
    document.querySelectorAll('.modal').forEach(modal => {
        const closeButton = modal.querySelector('.modal__cerrar');
        if (closeButton) closeButton.addEventListener('click', () => modal.classList.remove('visible'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('visible');
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

    // --- INICIALIZACIÓN DE LA PÁGINA ---
    initHeroSlider();
    if (typeof catalogoLUMO !== 'undefined') {
        mostrarProductos(productosFiltradosActuales);
        setTimeout(gestionarVistaCatalogo, 100); 
    }
    window.addEventListener('resize', gestionarVistaCatalogo);
});