
// Función para el efecto 'sticky' del header al hacer scroll
window.addEventListener("scroll", function(){
var header = document.querySelector("header");
header.classList.toggle("sticky", window.scrollY > 0);
});

/* let lastScroll = 0;
const header = document.querySelector("header");

window.addEventListener("scroll", function() {
    const currentScroll = window.scrollY;
    if (currentScroll > lastScroll && currentScroll > 0) {
        // Scroll hacia abajo: ocultar header
        header.style.top = "-80px"; // Ajusta el valor según la altura de tu header
    } else {
        // Scroll hacia arriba: mostrar header
        header.style.top = "0";
    }
    lastScroll = currentScroll;
});
 */
// Función para el menú de hamburguesa
function toggleMenu(){
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

menuToggle.classList.toggle('active');
navigation.classList.toggle('active');
}

// Nuevo: Cerrar el menú al hacer clic en un enlace
document.addEventListener('DOMContentLoaded', (event) => {
const navigationLinks = document.querySelectorAll('.navigation li a');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

navigationLinks.forEach(link => {
    link.addEventListener('click', () => {
    // Solo si el menú está abierto, lo cerramos
    if (navigation.classList.contains('active')) {
        menuToggle.classList.remove('active');
        navigation.classList.remove('active');
    }
    });
});
});
