document.addEventListener('DOMContentLoaded', () => {
    
    // ---------------------------------------------------
    // --- CONFIGURACIÓN DEL BANNER (CARRUSEL HERO) ---
    // Aquí puedes agregar o quitar videos e imágenes fácilmente.
    // Simplemente sigue el formato.
    // ---------------------------------------------------
    const heroMedia = [
        { 
            type: 'video', 
            src: 'videos/banner-video.mp4', 
            poster: 'imagenes/banner-video.jpg' // Imagen que se muestra mientras carga el video
        },
        { 
            type: 'video', 
            src: 'videos/banner-video3.mp4', 
            poster: 'imagenes/banner-video.jpg' // Imagen que se muestra mientras carga el video
        },
        { 
            type: 'video', 
            src: 'videos/banner-video2.mp4', 
            poster: 'imagenes/banner-video.jpg' // Imagen que se muestra mientras carga el video
        }
 //       { 
 //           type: 'image', 
 //           src: 'imagenes/banner-video.jpg' 
 //       },
 //       { 
 //           type: 'image', 
 //           src: 'imagenes/banner-video.jpg' 
 //       }
    ];
    // Duración de cada diapositiva en milisegundos (ej: 7000 = 7 segundos)
    const slideDuration = 3000;


    // --- LÓGICA DEL CARRUSEL DEL BANNER ---
    const heroSlider = document.getElementById('hero-slider');
    let currentSlideIndex = 0;

    function initHeroSlider() {
        if (!heroSlider) return;

        // Crea todos los slides y los añade al contenedor
        heroMedia.forEach((media, index) => {
            const slide = document.createElement('div');
            slide.classList.add('hero__slide');
            
            if (media.type === 'video') {
                slide.innerHTML = `
                    <video playsinline autoplay muted loop poster="${media.poster || ''}">
                        <source src="${media.src}" type="video/mp4">
                    </video>`;
            } else {
                slide.innerHTML = `<img src="${media.src}" alt="Imagen de fondo del banner">`;
            }
            
            if (index === 0) {
                slide.classList.add('active'); // Muestra el primer slide
            }
            heroSlider.appendChild(slide);
        });

        // Inicia el intervalo para cambiar de slide
        setInterval(changeSlide, slideDuration);
    }

    function changeSlide() {
        const slides = heroSlider.querySelectorAll('.hero__slide');
        if (slides.length <= 1) return;

        // Desactiva el slide actual
        slides[currentSlideIndex].classList.remove('active');

        // Calcula el índice del siguiente slide
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;

        // Activa el siguiente slide
        const nextSlide = slides[currentSlideIndex];
        nextSlide.classList.add('active');

        // Si el nuevo slide es un video, asegúrate de que se reproduzca
        const video = nextSlide.querySelector('video');
        if (video) {
            video.currentTime = 0; // Reinicia el video
            video.play();
        }
    }


    // --- EL RESTO DEL CÓDIGO PERMANECE IGUAL ---

    // --- CONFIGURACIÓN GENERAL Y ELEMENTOS DEL DOM ---
    const productosGrid = document.getElementById('productos-grid');
    const filtrosCategoria = document.getElementById('filtros-categoria');
    const currentYearSpan = document.getElementById('current-year');
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');

    // --- ACTUALIZAR AÑO DEL FOOTER ---
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- LÓGICA DE NAVEGACIÓN MÓVIL (MENÚ HAMBURGUESA) ---
    if (navToggle) {
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

    // --- LÓGICA DEL CATÁLOGO ---
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
            card.innerHTML = `
                <div class="producto-card__imagen-cont">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-card__imagen">
                    ${producto.oferta ? '<span class="producto-card__oferta">Oferta</span>' : ''}
                </div>
                <div class="producto-card__info">
                    <span class="producto-card__categoria">${producto.categoria}</span>
                    <h3 class="producto-card__nombre">${producto.nombre}</h3>
                    <p class="producto-card__descripcion">${producto.descripcion}</p>
                    <div class="producto-card__footer">
                        <div class="producto-card__precio">${precioHTML}</div>
                        <button class="boton producto-card__boton" data-nombre="${producto.nombre}">Me interesa</button>
                    </div>
                </div>`;
            productosGrid.appendChild(card);
        });
    }
    if (filtrosCategoria) {
        filtrosCategoria.addEventListener('click', (e) => {
            if (e.target.classList.contains('filtro')) {
                document.querySelector('.filtro.activo').classList.remove('activo');
                e.target.classList.add('activo');
                const categoria = e.target.dataset.categoria;
                const productosFiltrados = categoria === 'todos' ? catalogoLUMO : catalogoLUMO.filter(p => p.categoria === categoria);
                mostrarProductos(productosFiltrados);
            }
        });
    }
    if (typeof catalogoLUMO !== 'undefined') {
        mostrarProductos(catalogoLUMO);
    }
    
    // --- LÓGICA DE MODALES ---
    const allModals = document.querySelectorAll('.modal');
    if (productosGrid) {
        productosGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('producto-card__boton')) {
                const nombreProducto = e.target.dataset.nombre;
                const modalProducto = document.getElementById('modal-producto');
                document.getElementById('modal-producto-nombre').textContent = nombreProducto;
                document.getElementById('producto-oculto').value = nombreProducto;
                modalProducto.classList.add('visible');
            }
        });
    }
    const botonContacto = document.getElementById('boton-contacto-general');
    if (botonContacto) {
        botonContacto.addEventListener('click', () => {
            document.getElementById('modal-contacto').classList.add('visible');
        });
    }
    allModals.forEach(modal => {
        const closeButton = modal.querySelector('.modal__cerrar');
        closeButton.addEventListener('click', () => modal.classList.remove('visible'));
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

    // --- INICIALIZAR FUNCIONES AL CARGAR LA PÁGINA ---
    initHeroSlider(); // Inicia el carrusel del banner

});