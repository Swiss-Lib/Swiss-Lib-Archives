//Code principal
async function init() {
    //Règles de posts : utile pour les titres qui ont été renommé
    await loadPostRules();

    const params = new URLSearchParams(window.location.search);

    let id = new URLSearchParams(location.search)
        .get('id');

    id = id.replace(/\.html$/i, '');

    console.log(id);

    fetch(
    `https://archive-swisslib.deepmining.ch/post_archives.php?id=${encodeURIComponent(id)}`
    )
    .then(response => response.json())
    .then(data => {
        const post = data.post;
        //Mail
        let email = post.author.replace(/\s+at\s+/i, '@').replace(/<[^>]*>/g, '').trim();
        //Contenu
        let content = prepareContent(post.content);

        //Traitement du titre pour enlever la première balise
        let title_post = post.title.replace(/^\[Swiss-Lib\]\s*/, "");
        title_post = getDisplayTitle(title_post); //traiter les cas où le post est renommé
        //Bouton retour
        document.getElementById('backbutton').innerHTML = `<a href="index.html" class="btn-retour">
            ← Back to all posts
        </a>`;
        //Affichage du post
        document.getElementById('post-container').innerHTML = `
            <h1 id="titre_post">${title_post}</h1>
            <div class="message-meta">         
                <div>
                    <span class="label">👤 Auteur :</span>
                    ${post.adresse}
                </div>
                <div>
                    <span class="label">📅 Date :</span>
                    ${post.date}
                </div>
            </div>

            <div class="card-message">
                ${content}
            </div>
        `;

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

///////////////
// Fonctions//
//////////////

    //Préparer le contenu HTML avant affichage
    function prepareContent(html) {
        // Supprimer les marqueurs blocked::
      //  html = html.replace(
      //      /[^<\s]+&lt;blocked::(?=&lt;a)/gi,
       //     ''
      //  );
       // html = html.replace(
       //     /[\w.-]+\.[a-z]{2,}&lt;blocked::/gi,
       //     ''
       // );
       // html = html.replace(
      //      /(<\/a>)\s*&gt;/gi,
      //      '$1'
       // );
        //Gérer le contenu superflus
        html = additionalContent(html);
        // Enlever les << >> autour des liens
        html = html
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        html = html.replace(
            /<<a([^>]*)>(.*?)<\/a>>/gi,
            ' <a$1>$2</a>'
        );
        // Gérer les mails insérés dans le contenu
        html = fixMailtoLinks(html);
        //Ajout target blank
        html = addTargetBlank(html);

        //Traitement des espaces en trop dans les listes à -
        html = html.replace(
            /^\s*-\s*\n+\s*/gm,
            '- '
        );
        // Maximum 2 retours à la ligne consécutifs
        html = html.replace(
            /\n{3,}/g,
            '\n\n'
        );

        //Gestion du gras
        html = html.replace(
            /\*([^\n*]+)\*/g,
            '<strong>$1</strong>'
        );

        //Supprimer mailto identique
        const matches = html.match(
    /.{0,150}mailto:hr@tet\.com.{0,150}/gi
);

console.log(matches);
console.log(
    html.match(
        /.{0,150}mailto:[^"]+.{0,150}/gi
    )
);

console.log(html);
        return html;
    }


    //Mettre certains contenus superflus en "additional content"
    function additionalContent(html)
    {
        // Masquer tout ce qui suit "-------------- next part --------------"
        html = html.replace(
            /(-------------- next part --------------[\s\S]*)$/i,
            `<details class="hidden-part">
                <summary>Show additional content...</summary>
                $1
            </details>`
        );

        //Masquer d'autres éléments superflus
        html = html.replace(
            /(-----Ursprüngliche Nachricht-----[\s\S]*)$/i,
            `<details class="hidden-part">
                <summary>Show additional content...</summary>
                $1
            </details>`
        );
        
        return html;
    }

    // Traitements du contenu "MAILTO" reçu en HTML
    function fixMailtoLinks(html) {
        // 1. Supprime la queue "mailto:<a ...>...</a>" qu'elle soit encodée
        //    (&lt; ... &gt;) ou en chevrons littéraux (< ... >)
        html = html.replace(
            /(?:&lt;|<)mailto:<a[^>]*>[^<]*<\/a>(?:&gt;|>)/gi,
            ''
        );

        // 2. Convertit les formats "xxx at yyy.tld" restants en vrai lien mailto
        html = html.replace(
            /<a\s+href="[^"]*">\s*([^\s<]+)\s+at\s+([^\s<]+\.[^\s<]+)\s*<\/a>/gi,
            (match, local, domain) => {
            const email = `${local}@${domain}`;
            return `<a href="mailto:${email}">${email}</a>`;
            }
        );

        return html;
    }

    /* Pour ouvrir le lien dans un nouvel onglet */
    function addTargetBlank(html) {
    return html.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
        // Si target est déjà défini, on ne touche pas à la balise
        if (/target\s*=/i.test(attrs)) {
        return match;
        }
        return `<a ${attrs} target="_blank" rel="noopener noreferrer">`;
    });
    }

    //Retourne le titre corrigé s'il y'a eu un renommage manuel
    function getDisplayTitle(title) {
        const rule = getPostRule(id.replace(/\.html$/i, ''));
        if (rule?.rename) {
            return rule.rename;
        }
        else {
            return title;
        }
    }

    //Récupère une règle manuelle (s'il doit il y'avoir un rename, forcage catégorie ou cacher le post)
    function getPostRule(postId) {
        return POST_RULES.posts?.[postId] || null;

    }
}

//Initialisation du script
init();