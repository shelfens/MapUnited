document.addEventListener('DOMContentLoaded', function() {
    const fixedMenu = document.getElementById('fixedMenu');

    // Add mouseenter and mouseleave event listeners
    fixedMenu.addEventListener('mouseenter', function() {
        fixedMenu.classList.remove('shrinked');
        fixedMenu.classList.add('expanded');
    });

    fixedMenu.addEventListener('mouseleave', function() {
        fixedMenu.classList.remove('expanded');
        fixedMenu.classList.add('shrinked');
    });

    // Attachez l'événement de défilement pour mettre à jour le menu
    document.querySelector('main').addEventListener('scroll', updateMenu);

    // Attachez un écouteur d'événements à tous vos liens de navigation pour le défilement fluide
    document.querySelectorAll('a').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var targetID = this.getAttribute('href');
            // Appliquer le comportement seulement pour les liens internes (ceux avec un #)
            if (targetID.startsWith('#')) {
                e.preventDefault(); // Empêche le comportement par défaut du lien
                var targetSection = document.querySelector(targetID);
                // Si la section cible existe, faites défiler vers elle
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    updateMenu();
});

function updateMenu() {
    var sections = document.querySelectorAll('main .slide');
    var menuLinks = document.querySelectorAll('#fixedMenu a');
    var scrollPosition = document.querySelector('main').scrollTop;

    sections.forEach((section, index) => {
        // Calculer où la section se situe dans la page
        if (section.offsetTop <= scrollPosition && section.offsetTop + section.offsetHeight > scrollPosition) {
            // Retirer la classe 'active' de tous les liens
            menuLinks.forEach(link => {
                link.classList.remove('active');
            });
            // Ajouter la classe 'active' au lien qui correspond à la section
            menuLinks[index].classList.add('active');
        }
    });
}

var container = document.querySelector('.container');
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    container.scrollLeft += e.deltaY;
});



