import { MRAID, MRAIDEvent } from "./MRAID";
import { nullable } from "../utils/types";
import { AbstractRenderer, Application, autoDetectRenderer, Container, Renderer } from "pixi.js";

import initRAF from "../utils/RAF";

export interface AssetConfig {
    name: string;
    data: string;
}
export type AssetsConfig = AssetConfig[];

export class App {
    protected _canvas: nullable<HTMLCanvasElement>;
    protected _renderer: nullable<AbstractRenderer>;
    protected _stage: nullable<Container>;

    protected _mraid: nullable<MRAID>;

    protected _renderHandler = -1;
    protected _tickCurrent = 0;
    protected _tickPrevious = 0;

    protected _imageCache: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();

    constructor() {
        initRAF();
    }

    public async init(): Promise<void> {
        this.initRender();

        await this.initMRAID();

        this.onResize();
        this.startTicker();
    }

    protected initPIXI(): void {
        this._canvas = document.createElement("canvas") as HTMLCanvasElement;

        this._canvas.id = "appCanvas";
        this._canvas.width = Math.ceil(window.innerWidth);
        this._canvas.height = Math.ceil(window.innerHeight);

        this._renderer = autoDetectRenderer({
            width: this._canvas.width,
            height: this._canvas.height,
            view: this._canvas,
            backgroundAlpha: 0,
            antialias: false,
        });

        this._stage = new Container();

        document.getElementById("pixi")?.append(this._renderer.view);

        window.addEventListener("resize", this.onResize.bind(this));
        window.addEventListener("orientationchange", this.onOrientationChange);
    }

    protected initRender(): void {
        this.initPIXI();
    }

    protected async initMRAID(): Promise<void> {
        return new Promise((resolve) => {
            this._mraid = new MRAID();
            this._mraid.once(MRAIDEvent.Complete, resolve);
            this._mraid.init();
        });
    }

    protected startTicker(): void {
        this._renderHandler = window.requestAnimationFrame(this.onRequestAnimationFrame);
    }

    protected stopTicker(): void {
        window.cancelAnimationFrame(this._renderHandler);
    }

    protected onRequestAnimationFrame = (): void => {
        this._tickCurrent = performance.now();

        // 33 - 30 fps
        // 25 = 45 fps
        // 16 - 60 fps
        if (this._tickCurrent - this._tickPrevious > 25) {
            this._tickPrevious = this._tickCurrent;
            this.onRender();
        }

        //- RAF
        this.startTicker();
    };

    protected onRender(): void {
        if (this._stage) {
            this._renderer?.render(this._stage);
        }
    }

    public async load(images: AssetsConfig): Promise<void> {
        await this.loadImages(images);
    }

    protected async loadImages(images: AssetsConfig): Promise<void> {
        return new Promise((resolve) => {
            let loadIndex = 0;
            const loadTotalIndex = images.length;

            const onLoad = (name: string, image: HTMLImageElement | null) => {
                if (++loadIndex === loadTotalIndex) {
                    if (image) {
                        this._imageCache.set(name, image);
                    }
                    resolve();
                }
            };

            for (let i = 0; i < loadTotalIndex; i++) {
                const { name, data } = images[i];

                const image = new Image();

                image.onload = () => {
                    onLoad(name, image);
                    console.log(`App::loadImages() Loading success ${name}`);
                };
                image.onerror = () => {
                    onLoad(name, null);
                    console.error(`App::loadImages() Loading error ${name}`);
                };
                image.src = data;
            }
        });
    }

    public getImage(name: string): nullable<HTMLImageElement> {
        return this._imageCache.get(name);
    }

    protected onResize(): void {
        const { width, height } = this.getSize();

        const upscaleWidth = Math.ceil(1.5 * width);
        const upscaleHeight = Math.ceil(1.5 * height);

        if (this._renderer) {
            this._renderer.view.style.width = width + "px";
            this._renderer.view.style.height = height + "px";
            this._renderer.view.width = upscaleWidth;
            this._renderer.view.height = upscaleHeight;
            this._renderer.resize(upscaleWidth, upscaleHeight);
        }
    }

    protected onOrientationChange = (): void => {
        this.onResize();
    };

    public getSize(): { width: number; height: number } {
        return { width: this.getWidth(), height: this.getHeight() };
    }

    public getWidth(): number {
        return Math.ceil(window.innerWidth);
    }

    public getHeight(): number {
        return Math.ceil(window.innerHeight);
    }

    public getRenderer(): nullable<AbstractRenderer> {
        return this._renderer;
    }

    public getStage(): nullable<Container> {
        return this._stage;
    }
}
