export function getQueryLanguage(): string | null {
    const nav = window.navigator as any;
    const browserLanguagePropertyKeys = ["language", "browserLanguage", "systemLanguage", "userLanguage"];

    let language;

    if (Array.isArray(nav.languages)) {
        for (let i = 0; i < nav.languages.length; i++) {
            language = nav.languages[i];
            if (language && language.length) {
                return language.toLowerCase();
            }
        }
    }

    for (let i = 0; i < browserLanguagePropertyKeys.length; i++) {
        language = nav[browserLanguagePropertyKeys[i]];
        if (language && language.length) {
            return language.toLowerCase();
        }
    }

    return null;
}
