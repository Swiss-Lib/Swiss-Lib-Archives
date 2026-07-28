
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


// Chargement de FRANC et recalcul des langues //
window.addEventListener("franc-ready", () => {

    if (!archivesData) return;
    console.log("RECALCUL")
    archivesData.archives.forEach(archive => {

        archive.posts.forEach(post => {

            post.languages = getLanguages(post.title);

        });

    });

    applyFilters();

});

async function init() {
    await loadPostRules();
    loadArchives();
}

init();


//Charger les archives
async function loadArchives() {
    //
    // 1 - Affichage instantané du cache navigateur
    //

    const cachedData = localStorage.getItem('archivesCache');

    if (cachedData) {

        try {
            archivesData = preparePosts(JSON.parse(cachedData));
            applyFilters();

        } catch(e) {
            console.error(e);
        }

    }

    //
    // 2 - Mise à jour depuis le serveur
    //
    console.time("API");
    fetch(API_URL, {
        cache: 'no-store'
    })
        .then(response => response.json())
        .then(data => {

            const newCache = JSON.stringify(data);
            const oldCache = localStorage.getItem('archivesCache');
            console.timeEnd("API");
            if (newCache !== oldCache) {

                localStorage.setItem(
                    'archivesCache',
                    newCache
                );
            }
            archivesData = preparePosts(data);
            applyFilters();
        })
        .catch(error => {
            console.error(error);
        });
}

///////////////
// Fonctions//
//////////////

//Préparer les posts

function preparePosts(data) {
    
    //Cacher les posts superflus
    data.archives.forEach(archive => {

        archive.posts = archive.posts.filter(post => {

            const rule = getPostRule(
                post.url.replace(/\.html$/i, '')
            );

            return !rule?.hidden;

        });

        //Traiter les titres, les catégories et les langues
        archive.posts.forEach(post => {

            const rule = getPostRule(post.url.replace(/\.html$/i, ''));

            post.title = post.title.replace(/^\[Swiss-Lib\]\s*/,"");

            if (rule?.rename) {
                post.title = rule.rename;
            }

            post.languages = getLanguages(post.title);

            //Si la catégorie doit être forcée ou déterminée par rapport aux tags de catégories [] ou Regex
            if (rule?.category) {
                post.category = rule.category;
            } 
            else {
                post.category = getCategory(post.title);
            }

        });

    });

    return data;
}


//Récupère une règle manuelle (s'il doit il y'avoir un rename, forcage catégorie ou cacher le post)
function getPostRule(postId) {

    return POST_RULES.posts?.[postId] || null;

}
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
        currentCategory !== 'all'
        || currentLanguage !== 'all'
        || currentSearch !== '';

    //HTML où afficher les données
    const container = document.getElementById('archives-container');

    let html = ``; //HTML à afficher
    let displayedPosts = 0; //posts à afficher par section (utile avec le bouton voir plus)

    //Récupération des données pour l'affichage
    data.archives.forEach(archive => {

        let archiveHtml = '';
        let archiveHasPosts = false;

        archive.posts.reverse().forEach(post => {

            //On fuit si ces conditions sont satisfaites
            if (displayedPosts >= visiblePosts) {
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
            updateLoadMoreButton(filteredData);
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

    //On remet le nombre de post affiché par défaut
    visiblePosts = postsPerPage;

    currentCategory = filter;

    applyFilters();
}

// Déterminer les catégories
function getCategory(title = "") {
    
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

    //On remet le nombre de post affiché par défaut
    visiblePosts = postsPerPage;

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

 // Si aucune langue trouvée, essayer Franc
    if (
        languages.length === 0 &&
        typeof window.detectLanguageFranc === "function"
    ) {

        const detected =
            window.detectLanguageFrancAll(title, {
                only: ["fra", "deu", "ita", "eng"]
            });
        

        const map = {
            fra: "fr",
            deu: "de",
            ita: "it",
            eng: "en"
        };

        if (map[detected]) {
            languages.push(map[detected]);
        }
    }

    return languages.length
        ? languages
        : ["unknown"];
}

//
// Mise à jour des posts visibles
//

function updateLoadMoreButton(data = archivesData) {

    const button =
        document.getElementById('load-more-btn');

    if (!button || !data) {
        return;
    }

    const totalPosts = data.archives.reduce(
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