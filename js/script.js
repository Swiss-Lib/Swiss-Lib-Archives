/* Constantes des filtres / langues, contenant les REGEX et termes pour catégoriser et rechercher les posts */

/* Posts à supprimer de l'affichage */
const BLACKLIST_POSTS = [
    /TEST 0/i,
    /Test 2/i,
    /TEST 30.04 - Nouvelle version Swiss-Lib/i,
    /TEST 30.04 - Nouvelle version Swiss-Lib/i,
    /Supprimer une adresse mail/i,
    /mon premier mail ici/i
];

/* Recatégorie manuel */
const MANUAL_CATEGORIES = {
    "Soirée du GRBV - Prix romand de bibliothéconomie 2025": "evenements",
    'Online Lecture: "Beyond the 3D Model: When Heritage Becomes Data, Evidence, and Memory': "evenements"
};

/* Regex pour les termes à détecter dans l'entierêté du titre */
const FILTERS = {

        emploi: /(emploi|stage|apprentissage|pre.stage|pré.stage|hes|cdi|cdd|demande.emploi|spontan|arbeit|praktikum|lehrstelle|fh.vorpraktikum|vorpraktikum|unbefristet|befristet|einstellung|spontanbewerbung|lavoro|apprendistato|tirocinio|pre.tirocinio|sup|cti|ctd|candidatura|vacancy|hiring|recruitment|poste|post|stelle|\bstelle\w*|job)/i,

        evenements: /(evenement|event|symposium|veranstaltung|jahrestagung|evento|conference|kongress|convegno|colloque|journee|tagung|giornata|webinaire|webinar|salon|messe|fiera|save the date)/i,

        communaute: /\b(communaute|communautes|community|gemeinschaft|comunita|annonce|ankündigung|annuncio|information|actualite|neuigkeit|notizia|news)\b/i,

        formations: /(formation\s+continue|formation|formations|continuing\s+professional\s+development|weiterbildung|weiterbildungskurs|formazione\s+continua|competences|competencies|skills|kompetenzen|competenze)/i,

        ressources: /(ressource|ressources|resource|ressourcen|risorsa|outil|tool|werkzeug|strumento|guide|leitfaden|guida|publication|publikation|pubblicazione|rapport|bericht|rapporto)/i,

        recherches: /(recherches?\s+et\s+contributions?|recherche|contribution|forschung|ricerca|appel|aufruf|chiamata|call|enquete|umfrage|sondaggio|survey|collaborat|projet|projekt|progetto|call(?:\s+of|\s+for)?\s+papers)/i,

        newsletter: /(newsletter|Swiss-Lib-Team)/i

    };
    

 /* Tags pour détecter les termes entre [] */
const TAGS = {

    // Emploi
    "emploi": "emploi",
    "arbeit": "emploi",
    "lavoro": "emploi",
    
    // Variantes de
    "stelle": "emploi",
    "stellenangebot": "emploi",
    "stellenausschreibung": "emploi",
    "stellenanzeige": "emploi",
    "stelleninserat": "emploi",

    // Variantes it
    "offerta di lavoro": "emploi",
    "posto di lavoro": "emploi",


    // Événements
    "evenement": "evenements",
    "evenements": "evenements",
    "événement": "evenements",
    "événements": "evenements",
    "veranstaltung": "evenements",
    "veranstaltungen": "evenements",
    "evento": "evenements",
    "eventi": "evenements",

    // Recherches
    "recherche": "recherches",
    "recherches": "recherches",
    "recherches et contributions": "recherches",
    "forschung": "recherches",
    "ricerca": "recherches",
    "ricerche": "recherches",
    "call for papers": "recherches",
    "Call for Papers": "recherches",

    // Formations
    "formation": "formations",
    "formations": "formations",
    "weiterbildung": "formations",
    "weiterbildungen": "formations",
    "formazione": "formations",
    "formazioni": "formations",

    // Ressources
    "ressource": "ressources",
    "ressources": "ressources",
    "ressource(s)": "ressources",
    "ressourcen": "ressources",
    "risorsa": "ressources",
    "risorse": "ressources",

    // Communauté
    "communaute": "communaute",
    "communauté": "communaute",
    "gemeinschaft": "communaute",
    "comunita": "communaute",
    "comunità": "communaute",

    // Newsletter
    "newsletter": "newsletter"
};

/* Mots-clés pour détecter les langues */
const LANGUAGES = {
    fr: /\b(le|la|les|des|et|de|du|pour|avec|questionnaire|recherche|emploi|offre|formation|formations|événement|événements|rappel|congrès|bibliothèque|rentrée|poste|candidature)\b/i,

    de: /\b(der|die|das|den|dem|und|von|im|für|mit|forschung|arbeit|veranstaltung|veranstaltungen|kongress|bibliothek|stelle|bewerbung|weiterbildung)\b/i,

    it: /\b(il|lo|gli|della|delle|dello|dei|e|per|con|ricerca|lavoro|evento|eventi|congresso|biblioteca|formazione|candidatura|chiusura|piattaforma|newsletter)\b/i,

    en: /\b(the|for|with|research|survey|job|jobs|event|events|conference|library|reminder|vacancy|recruitment|hiring)\b/i
};

//Variables
const API_URL = 'https://archive-swisslib.deepmining.ch/index.php'; //URL API
let visiblePosts = 20; //posts visible par défaut
const postsPerPage = 20; //posts par affichage
let archivesData = null; //valeur par défaut des archives
let currentData = null;       // données actuellement affichées

//Variables pour les catégories / langue / recherche
let currentCategory = 'all';
let currentLanguage = 'all';
let currentSearch = '';



//
// 1 - Affichage instantané du cache navigateur
//

const cachedData = localStorage.getItem('archivesCache');

if (cachedData) {

    try {
        archivesData = JSON.parse(cachedData);
        //Catégories à déterminer
        archivesData.archives.forEach(archive => {

            archive.posts = archive.posts.filter(post => {
                return !BLACKLIST_POSTS.some(regex =>
                regex.test(post.title)
            );
        });

            archive.posts.forEach(post => {
                post.title = post.title.replace(/^\[Swiss-Lib\]\s*/, "");
                post.languages = getLanguages(post.title);
                post.category = getCategory(post.title);
            });
        });

        applyFilters();

    } catch(e) {
        console.error(e);
    }

}

//
// 2 - Mise à jour depuis le serveur
//

fetch(API_URL, {
    cache: 'no-store'
})
    .then(response => response.json())
    .then(data => {

        const newCache = JSON.stringify(data);
        const oldCache = localStorage.getItem('archivesCache');

        if (newCache !== oldCache) {

            localStorage.setItem(
                'archivesCache',
                newCache
            );
        }
        data.archives.forEach(archive => {

            archive.posts = archive.posts.filter(post => {
                return !BLACKLIST_POSTS.some(regex =>
                regex.test(post.title)
            );
        });
            archive.posts.forEach(post => {
                post.title = post.title.replace(/^\[Swiss-Lib\]\s*/, "");
                post.languages = getLanguages(post.title);
                post.category = getCategory(post.title);
            });
        });
        archivesData = data;
        applyFilters();
    })
    .catch(error => {
        console.error(error);
    });

///////////////
// Fonctions//
//////////////

// Afficher les archives
// data : données des posts à afficher
function renderArchives(data) {
    
    //Mode recherche ?
    const isSearching =
        document.getElementById('search-category')
            ?.value
            ?.trim() !== '';
        currentData = data;

    //Mode filtre ?
    const isFiltered =
        document.querySelector('.filters button.active') &&
        !document.querySelector('.filters button.active')
            .textContent
            .includes('Tous');

    //HTML où afficher les données
    const container = document.getElementById('archives-container');

    let html = ``; //HTML à afficher
    let displayedPosts = 0; //posts à afficher par section (utile avec le bouton voir plus)

    //Récupération des données pour l'affichage
    data.archives.forEach(archive => {

        let archiveHtml = '';
        let archiveHasPosts = false;

        archive.posts.forEach(post => {

            //On fuit si ces conditions sont satisfaites
            if (!isSearching && !isFiltered && displayedPosts >= visiblePosts) {
                return;
            }

            archiveHasPosts = true;
            displayedPosts++;

            const url =
                'post_archives.html?id=' +
                encodeURIComponent(post.url);
            //let title_post = post.title.replace(/^\[Swiss-Lib\]\s*/, "");

            archiveHtml += `
                <div class="card-archives"
                     data-category="${post.category}">
                    <a href="${url}">
                        <span class="badge ${post.category}"></span>
                        <span class="title">${post.title}</span>
                        <span class="author">${post.author}</span>
                    </a>
                </div>
            `;
        });

    //S'il y'a des archives, on affiche les posts
    if (archiveHasPosts) {

                html += `
                    <h2>${archive.title}</h2>

                    <div class="cards-container-archives">
                        ${archiveHtml}
                    </div>
                `;
            }

        });

    container.innerHTML = html;

    const loadMoreBtn =
        document.getElementById('load-more-btn');

    if (loadMoreBtn) {

        if (isSearching) {

            loadMoreBtn.style.display = 'none';

        } else {

            updateLoadMoreButton();
        }

    }
}

// Applique les filtres (catégories et langages) pour afficher les posts

function applyFilters() {

    const filteredData = {
        success: true,
        archives: archivesData.archives
            .map(archive => ({
                ...archive,
                posts: archive.posts.filter(post => {
                    // Prends en compte les filtres et l'état de la recherche
                    const matchCategory =
                        currentCategory === 'all'
                        || post.category === currentCategory;

                    const matchLanguage =
                        currentLanguage === 'all'
                        || (
                            post.languages &&
                            post.languages.includes(currentLanguage)
                        );

                    const matchSearch =
                        currentSearch === ''
                        || (
                            (post.title + ' ' + post.author)
                                .toLowerCase()
                                .includes(currentSearch)
                        );

                    return (
                        matchCategory &&
                        matchLanguage &&
                        matchSearch
                    );
                })
            }))
            .filter(archive => archive.posts.length > 0)
    };

    renderArchives(filteredData);
    
    //Cacher le bouton de voir plus si on est pas en "all"
    const loadMoreBtn =
        document.getElementById('load-more-btn');

    const hasActiveFilters =
        currentCategory !== 'all'
        || currentLanguage !== 'all'
        || currentSearch !== '';

        if (loadMoreBtn) {

            if (hasActiveFilters) {

                loadMoreBtn.style.display = 'none';

            } else {

                updateLoadMoreButton();

            }
        }
}

//
// Filtres des posts
//

function filterPosts(filter, button_object) {

    document
        .querySelectorAll('.filters button')
        .forEach(btn => btn.classList.remove('active'));

    button_object.classList.add('active');

    currentCategory = filter;

    applyFilters();
}

// Déterminer les catégories
function getCategory(title = "") {
    
    // Recatégoriser manuellement ceux qui n'ont pas de catégories
    if (MANUAL_CATEGORIES[title]) {
        return MANUAL_CATEGORIES[title];
    }

    // Vérification des tags entre []
    const match = title.match(/^\[([^\]]+)\]/);

    if (match) {
        const tag = match[1]
            .trim()
            .toLowerCase();

            if (TAGS[tag]) {

            return TAGS[tag];
        }

        // Variantes allemandes commençant par "stelle"
        if (tag.startsWith("stelle")) {
            return "emploi";
        }
    }

    // On retire le tag avant les regex
    const cleanTitle = title.replace(
        /^\[[^\]]+\]\s*/,
        ''
    );

    // Fallback sur les regex existantes
    if (FILTERS.newsletter.test(cleanTitle)) return "newsletter";
    if (FILTERS.emploi.test(cleanTitle)) return "emploi";
    if (FILTERS.evenements.test(cleanTitle)) return "evenements";
    if (FILTERS.formations.test(cleanTitle)) return "formations";
    if (FILTERS.ressources.test(cleanTitle)) return "ressources";
    if (FILTERS.recherches.test(cleanTitle)) return "recherches";
    if (FILTERS.communaute.test(cleanTitle)) return "communaute";

    return "autre";
}


//
// Filtres des langues
//
function filterLanguage(language, button_object) {

    document
        .querySelectorAll('.language-filters button')
        .forEach(btn => btn.classList.remove('active'));

    button_object.classList.add('active');

    currentLanguage = language;

    applyFilters();
}

//Fonction pour déterminer la langue du post

function getLanguages(title = "") {

    const languages = [];

    //Comparer dans la liste des termes pour chaque langue
    Object.entries(LANGUAGES).forEach(([lang, regex]) => {

        const matched = regex.test(title);

        if (matched) {
            languages.push(lang);
        }

    });

    

    return languages.length
        ? languages
        : ["unknown"];
}

//
// Mise à jour des posts visibles
//

function updateLoadMoreButton() {

    const button =
        document.getElementById('load-more-btn');

    if (!button || !archivesData) {
        return;
    }

    const totalPosts = archivesData.archives.reduce(
        (total, archive) =>
            total + archive.posts.length,
        0
    );

    button.style.display =
        visiblePosts >= totalPosts
            ? 'none'
            : '';
}

document
    .getElementById('load-more-btn')
    .addEventListener('click', () => {

        visiblePosts += postsPerPage;

        applyFilters();

    });
//
// Recherche des posts
//

document.addEventListener('DOMContentLoaded', () => {

    const searchInput = document.getElementById('search-category');

    if (!searchInput) return;

searchInput.addEventListener('input', () => {

    currentSearch = searchInput.value
        .trim()
        .toLowerCase();

    applyFilters();

});

});


/* Flèche de retour en haut */

const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {

    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }

});