const params = new URLSearchParams(window.location.search);

const id = new URLSearchParams(location.search)
    .get('id');



fetch(
  `https://archive-swisslib.deepmining.ch/post_archives.php?id=${encodeURIComponent(id)}`
)
.then(response => response.json())
.then(data => {
    const post = data.post;
    let email = post.author.replace(/\s+at\s+/i, '@').replace(/<[^>]*>/g, '').trim();

    
    let content = post.content;


        // Masquer tout ce qui suit "-------------- next part --------------"
        content = content.replace(
            /(-------------- next part --------------[\s\S]*)$/i,
            `<details class="hidden-part">
                <summary>Show additional content...</summary>
                $1
            </details>`
        );

        // Enlever les << >> autour des liens
        content = content
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

        content = content.replace(
            /<<a([^>]*)>(.*?)<\/a>>/gi,
            ' <a$1>$2</a>'
        );

     // Gérer les mails insérés dans le contenu
            content = fixMailtoLinks(content);
        //Ajout target blank
            content = addTargetBlank(content);
    //Traitement du titre pour enlever la première balise
    let title_post = post.title.replace(/^\[Swiss-Lib\]\s*/, "");
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

/* Retour en haut */

const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {

    if (window.scrollY > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }

});

// Traitements du contenu reçu en HTML

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