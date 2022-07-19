import { getWindow } from "./getWindow";

export default function initRAF(tick = 16): void {
    const vendors = ["ms", "moz", "webkit", "o"];
    let lastTime = 0;

    for (let x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        getWindow().requestAnimationFrame = getWindow()[vendors[x] + "RequestAnimationFrame"];
        getWindow().cancelAnimationFrame =
            getWindow()[vendors[x] + "CancelAnimationFrame"] || getWindow()[vendors[x] + "CancelRequestAnimationFrame"];
    }

    if (!getWindow().requestAnimationFrame) {
        getWindow().requestAnimationFrame = function (callback: any) {
            const currTime = new Date().getTime();
            const timeToCall = Math.max(0, tick - (currTime - lastTime));

            const id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);

            lastTime = currTime + timeToCall;

            return id;
        };
    }

    if (!getWindow().cancelAnimationFrame) {
        getWindow().cancelAnimationFrame = function (id: number) {
            clearTimeout(id);
        };
    }
}
