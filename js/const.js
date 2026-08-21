/* Constantes contenant les règles à redéfinir : catégorie à forcer sur un post, renommer un post ou cacher un post*/

async function loadPostRules() {

    try {

        const response =
            await fetch('json/post-rules.json?v=12');

        POST_RULES =
            await response.json();

        console.log(
            "Règles chargées",
            POST_RULES
        );

    } catch(error) {

        console.error(error);

    }

}

/* Regex pour les termes à détecter dans l'entierêté du titre */
const FILTERS = {

        emploi: /(annonce|%|emploi|stage|apprentissage|pre.stage|pré.stage|hes|cdi|cdd|demande.emploi|spontan|arbeit|praktikum|lehrstelle|fh.vorpraktikum|vorpraktikum|unbefristet|befristet|einstellung|spontanbewerbung|lavoro|apprendistato|tirocinio|pre.tirocinio|sup|cti|ctd|candidatura|vacancy|hiring|recruitment|poste|post|stelle|\bstelle\w*|job)/i,

        evenements: /(evenement|event|symposium|veranstaltung|jahrestagung|evento|conference|kongress|convegno|colloque|journee|tagung|giornata|webinaire|webinar|salon|messe|fiera|save the date|meet & greet|panel discussion)/i,

        communaute: /\b(communaute|communautes|community|gemeinschaft|comunita|annonce|ankündigung|annuncio|information|actualite|neuigkeit|notizia|news)\b/i,

        formations: /(formation\s+continue|formation|formations|continuing\s+professional\s+development|weiterbildung|weiterbildungskurs|ausbildung|formazione\s+continua|competences|competencies|skills|kompetenzen|competenze|CAS|MAS|DAS)/i,

        ressources: /(ressource|ressources|resource|ressourcen|risorsa|outil|tool|werkzeug|strumento|guide|leitfaden|guida|publication|publikation|pubblicazione|rapport|bericht|rapporto|gratis abzugeben)/i,

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
    "evènement": "evenements",
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
    fr: /\b(le|la|les|des|et|de|du|pour|avec|questionnaire|recherche|emploi|offre|formation|formations|événement|événements|rappel|congrès|bibliothèque|rentrée|poste|candidature|collaborateur)\b/i,

    de: /\b(der|die|das|den|dem|und|von|im|für|mit|forschung|arbeit|veranstaltung|veranstaltungen|kongress|bibliothek|stelle|\bstelle\w*|inserat|bewerbung|weiterbildung|praktikumsstelle|praktikum|publikationsberatung|\bpublikation\w*|abzugeben)\b/i,

    it: /\b(lo|gli|della|delle|dello|dei|per|con|ricerca|lavoro|evento|eventi|congresso|biblioteca|formazione|candidatura|chiusura|piattaforma|opzioni|newsletter)\b/i,

    en: /\b(the|for|with|research|survey|job|jobs|event|events|conference|library|reminder|vacancy|recruitment|hiring|approval)\b/i
};
