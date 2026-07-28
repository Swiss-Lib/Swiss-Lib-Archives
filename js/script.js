
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

// Empêche le navigateur de restaurer lui-même le scroll
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

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

    const isReturningFromPost =
        sessionStorage.getItem(
            'returningFromPost'
        ) === 'true';

    if (!isReturningFromPost) {

        window.scrollTo({
            top: 0,
            behavior: 'auto'
        });

    }

    await loadPostRules();

    restoreState();

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
            console.log(
                "CACHE",
                JSON.parse(cachedData)
                    .archives[0]
                    ?.posts[0]
                    ?.title
            );
            console.log(
                "CACHE",
                JSON.parse(cachedData).archives[0].posts.length
            );

            /*restoreVisiblePosts()*/
            applyFilters();

        } catch(e) {
            console.error(e);
        }

    }

    //
    // 2 - Mise à jour depuis le serveur
    //
    console.log("Début API");
    console.time("API");
    console.log(
        "Début API",
        new Date().toLocaleTimeString()
    );

    console.time("HTTP");

    fetch(API_URL, {
        cache: 'no-store'
    })
            .then(response => {

console.timeEnd("HTTP");

console.log(
    "Fin API",
    new Date().toLocaleTimeString()
);

            return response.json();

            })
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
            console.log(
                "API",
                data.archives[0]
                    ?.posts[0]
                    ?.title
            );
            console.log(
                "API",
                data.archives[0].posts.length
            );
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
            let idpost = post.url.replace(/\.html$/i, '');
            let safePostId = idpost.replaceAll('/', '-');

            const url =
                'post_archives.html?id=' + encodeURIComponent(post.url);
            //let title_post = post.title.replace(/^\[Swiss-Lib\]\s*/, "");
   
            archiveHtml += `
                <div id="${safePostId}" class="card-archives"
                     data-category="${post.category}">
                    <a href="${url}" onclick="rememberPost('${safePostId}')">
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
    //Si les posts affichés sont au nombre de 0
    if (displayedPosts === 0) {

        if (currentSearch !== '') {

            html = `
                <div class="no-results">
                    Aucun résultat pour
                    "<strong>${currentSearch}</strong>".
                </div>
            `;

        } else {

            html = `
                <div class="no-results">
                    Aucun post ne correspond aux filtres sélectionnés.
                </div>
            `;

        }

    }
    container.innerHTML = html;
    restoreLastPostPosition();
           
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
    
    //Apparition du bouton "voir plus" seulement quand il y'a assez de posts à réafficher
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

        const bestLanguage = detected?.[0]?.[0];

        if (map[bestLanguage]) {
            languages.push(map[bestLanguage]);
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

/* Quand on clique sur un post, se remémorer de là où on vient (filtres de l'utilisateur et derniers posts) */
function rememberPost(postId) {


    sessionStorage.setItem(
        'returningFromPost',
        'true'
    );

    sessionStorage.setItem(
    'returnTimestamp',
    Date.now()
    );

    sessionStorage.setItem(
        'lastPostId',
        postId
    );

    sessionStorage.setItem(
        'visiblePosts',
        visiblePosts
    );

    sessionStorage.setItem(
        'currentCategory',
        currentCategory
    );

    sessionStorage.setItem(
        'currentLanguage',
        currentLanguage
    );

    sessionStorage.setItem(
        'currentSearch',
        currentSearch
    );
}

//Restaurer le scroll sur la page
function restoreLastPostPosition() {

    const lastPostId =
        sessionStorage.getItem('lastPostId');

    if (!lastPostId) {
        return;
    }

    const postElement =
        document.getElementById(
            `${lastPostId}`
        );

    if (!postElement) {
        return;
    }

    postElement.scrollIntoView({
        block: 'center'
    });

    // Nettoyage
    setTimeout(() => {

        sessionStorage.removeItem('returningFromPost');
        sessionStorage.removeItem('lastPostId');
        sessionStorage.removeItem('visiblePosts');
        sessionStorage.removeItem('currentCategory');
        sessionStorage.removeItem('currentLanguage');
        sessionStorage.removeItem('currentSearch');

    }, 200);
}
//Restaurer l'état des filtres et recherche quand on revient d'un post
function restoreState() {

    const isReturningFromPost =
        sessionStorage.getItem(
            'returningFromPost'
        ) === 'true';

    const timestamp =
        sessionStorage.getItem(
            'returnTimestamp'
        );

    const isRecentReturn =
        timestamp &&
        (
            Date.now() -
            parseInt(timestamp, 10)
        ) < 5 * 60 * 1000; // 5 minutes

    if (
        !isReturningFromPost ||
        !isRecentReturn
    ) {

        clearStoredState();

        visiblePosts = postsPerPage;
        currentCategory = 'all';
        currentLanguage = 'all';
        currentSearch = '';

        return;

    }

    // Nombre de posts affichés
    const savedVisiblePosts =
        sessionStorage.getItem(
            'visiblePosts'
        );

    if (savedVisiblePosts) {

        visiblePosts =
            parseInt(savedVisiblePosts, 10);

    }

    // Filtres
    currentCategory =
        sessionStorage.getItem(
            'currentCategory'
        ) || 'all';

    currentLanguage =
        sessionStorage.getItem(
            'currentLanguage'
        ) || 'all';

    currentSearch =
        sessionStorage.getItem(
            'currentSearch'
        ) || '';

    // Boutons catégories
    document
        .querySelectorAll('.filters button')
        .forEach(btn =>
            btn.classList.remove('active')
        );

    document
        .querySelector(
            `.filters button[value="${currentCategory}"]`
        )
        ?.classList.add('active');

    // Boutons langues
    document
        .querySelectorAll('.language-filters button')
        .forEach(btn =>
            btn.classList.remove('active')
        );

    document
        .querySelector(
            `.language-filters button[value="${currentLanguage}"]`
        )
        ?.classList.add('active');

    // Select mobile catégories
    const categorySelect =
        document.getElementById(
            'filters_select'
        );

    if (categorySelect) {

        categorySelect.value =
            currentCategory;

    }

    // Select mobile langues
    const languageSelect =
        document.getElementById(
            'languages_select'
        );

    if (languageSelect) {

        languageSelect.value =
            currentLanguage;

    }

    // Recherche
    const searchInput =
        document.getElementById(
            'search-category'
        );

    if (searchInput) {

        searchInput.value =
            currentSearch;

    }

}

function clearStoredState() {

    sessionStorage.removeItem(
        'returningFromPost'
    );

    sessionStorage.removeItem(
        'returnTimestamp'
    );

    sessionStorage.removeItem(
        'lastPostId'
    );

    sessionStorage.removeItem(
        'visiblePosts'
    );

    sessionStorage.removeItem(
        'currentCategory'
    );

    sessionStorage.removeItem(
        'currentLanguage'
    );

    sessionStorage.removeItem(
        'currentSearch'
    );

}

function restoreVisiblePosts() {

    const savedVisiblePosts =
        sessionStorage.getItem(
            'visiblePosts'
        );

    if (savedVisiblePosts) {

        visiblePosts =
            parseInt(savedVisiblePosts, 10);

    }

}

//Pour le mobile
window.addEventListener('focus', () => {
   console.log('FOCUS');
});


window.addEventListener('pageshow', () => {
    alert('PAGESHOW');
});

window.addEventListener('online', () => {
    alert('ONLINE');
});

document.addEventListener('resume', () => {
    alert('RESUME');
});