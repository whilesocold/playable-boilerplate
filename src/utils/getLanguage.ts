import { getQueryLanguage } from "./getQueryLanguage";
import { getWindow } from "./getWindow";

export function getLanguage(): string {
    const params = getWindow().params;
    let language = getQueryLanguage() ?? "en";

    if (!params.languages[language]) {
        if (language.indexOf("-") != -1) {
            language = language.split("-")[0];
        }
        if (!params.languages[language]) {
            language = "en";
        }
    }

    return language;
}
