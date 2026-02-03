// ===================================
// FUNCIÓN DE DESCARGA DE PDF
// ===================================
async function descargarPDF() {
    const boton = document.querySelector('.download-btn');
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<span>⏳</span><span>Generando PDF...</span>';
    boton.disabled = true;

    // Pequeña pausa para que el botón se actualice visualmente antes de bloquear el hilo
    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        const { jsPDF } = window.jspdf;
        const elemento = document.getElementById('infografia-content');

        // Esperar a que todas las imágenes estén cargadas
        const imagenes = elemento.querySelectorAll('img');
        await Promise.all(
            Array.from(imagenes).map(img =>
                img.complete
                    ? Promise.resolve()
                    : new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve; // no bloquear si falla una imagen
                    })
            )
        );

        // Obtener la altura real del contenido
        const alturaTotalContenido = elemento.scrollHeight;

        const canvas = await html2canvas(elemento, {
            scale: 2,                          // calidad alta sin ser excesivo
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: elemento.offsetWidth,  // ancho real del contenedor
            windowHeight: alturaTotalContenido, // altura total explícita
            scrollY: 0,
            scrollX: 0,
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById('infografia-content');
                // Asegurar que el clon tenga las mismas dimensiones
                clonedElement.style.width = elemento.offsetWidth + 'px';
                clonedElement.style.height = alturaTotalContenido + 'px';
                clonedElement.style.overflow = 'visible';
                // Ocultar botón de descarga en el clon
                const btn = clonedDoc.querySelector('.download-btn');
                if (btn) btn.style.display = 'none';
                // Forzar visibilidad de todos los elementos (por animaciones)
                clonedElement.querySelectorAll('*').forEach(el => {
                    el.style.opacity = '1';
                    el.style.transform = 'none';
                    el.style.animation = 'none';
                });
            }
        });

        const imgData = canvas.toDataURL('image/png', 1.0);

        // Crear PDF A4 portrait
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });

        const pdfWidth  = pdf.internal.pageSize.getWidth();   // 210 mm
        const pdfHeight = pdf.internal.pageSize.getHeight();  // 297 mm

        // Escalar la imagen al ancho de la página
        const imgWidth  = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Dividir en páginas
        const totalPages = Math.ceil(imgHeight / pdfHeight);

        for (let page = 0; page < totalPages; page++) {
            if (page > 0) pdf.addPage();

            pdf.addImage(
                imgData,
                'PNG',
                0,                          // x
                -(page * pdfHeight),        // y (desplazar hacia arriba por página)
                imgWidth,
                imgHeight,
                undefined,
                'FAST'
            );
        }

        pdf.save('Proceso_Administrativo_Infografia.pdf');

        boton.innerHTML = '<span>✅</span><span>¡PDF Descargado Exitosamente!</span>';
        setTimeout(() => {
            boton.innerHTML = textoOriginal;
            boton.disabled = false;
        }, 3000);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        boton.innerHTML = '<span>❌</span><span>Error. Intenta nuevamente</span>';
        setTimeout(() => {
            boton.innerHTML = textoOriginal;
            boton.disabled = false;
        }, 3000);
    }
}

// ===================================
// EFECTOS VISUALES CON SCROLL
// ===================================
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const windowHeight = window.innerHeight;

    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop < windowHeight * 0.75) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
});

// ===================================
// INICIALIZACIÓN DE EFECTOS
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar transiciones en secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.style.transition = 'all 0.6s ease';
    });

    // Agregar cursor pointer a elementos interactivos
    const interactiveElements = document.querySelectorAll('.funcion-card, .recurso-item, .vocab-table tbody tr');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.cursor = 'pointer';
        });
    });

    // Observer para animaciones al hacer scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observar números de sección
    document.querySelectorAll('.section-number').forEach(num => {
        observer.observe(num);
    });

    console.log('✅ Infografía cargada correctamente');
    console.log('📄 Para descargar el PDF, haz clic en el botón flotante');
});

// ===================================
// PREVENIR ERRORES DE CARGA DE IMÁGENES
// ===================================
window.addEventListener('load', () => {
    const images = document.querySelectorAll('.custom-image');

    images.forEach(img => {
        img.addEventListener('error', function() {
            console.warn('⚠️ Error al cargar la imagen:', this.src);
            this.style.display = 'none';

            const errorMsg = document.createElement('div');
            errorMsg.className = 'image-error';
            errorMsg.style.cssText = `
                padding: 20px;
                background: #fff3cd;
                border: 2px dashed #ffc107;
                border-radius: 10px;
                text-align: center;
                color: #856404;
                margin: 20px 0;
            `;
            errorMsg.innerHTML = '⚠️ No se pudo cargar la imagen. Verifica la ruta del archivo.';
            this.parentNode.insertBefore(errorMsg, this.nextSibling);
        });
    });
});