import { MRAID, MRAIDEvent } from "./MRAID";
import { AbstractRenderer, autoDetectRenderer, Container, Graphics, Renderer, Sprite, Texture, utils } from "pixi.js";
import { Joystick } from "pixi-virtual-joystick";

import initRAF from "../utils/RAF";

export interface AssetConfig {
    name: string;
    data: string;
    type?: string;
}
export type AssetsConfig = AssetConfig[];

export enum AppEvent {
    RENDER = "AppEvent.RENDER",
    RESIZE = "AppEvent.RESIZE",
    JOYSTICK_CHANGE = "AppEvent.JOYSTICK_CHANGE",
    JOYSTICK_START = "AppEvent.JOYSTICK_START",
    JOYSTICK_END = "AppEvent.JOYSTICK_END",
}

export class App extends utils.EventEmitter {
    protected _canvas!: HTMLCanvasElement;
    protected _renderer!: AbstractRenderer;
    protected _stage!: Container;

    protected _mraid!: MRAID;

    protected _renderHandler = -1;
    protected _tickCurrent = 0;
    protected _tickPrevious = 0;

    protected _imageCache: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();
    protected _texture2dCache: Map<string, Texture> = new Map<string, Texture>();

    protected _joystick!: Joystick;

    constructor() {
        super();

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

    protected initJoystick(): void {
        const outerGraphics = new Graphics();
        outerGraphics.beginFill(0xffffff, 0.5);
        outerGraphics.drawCircle(0, 0, 128);
        outerGraphics.endFill();

        const innerGraphics = new Graphics();
        innerGraphics.beginFill(0xffffff, 0.9);
        innerGraphics.drawCircle(0, 0, 32);
        innerGraphics.endFill();

        this._joystick = new Joystick({
            outer: outerGraphics,
            inner: innerGraphics,

            outerScale: { x: 0.5, y: 0.5 },
            innerScale: { x: 0.8, y: 0.8 },

            onChange: ({ angle, direction, power }) => {
                this.emit(AppEvent.JOYSTICK_CHANGE, { angle, direction, power });
            },
            onStart: () => {
                this.emit(AppEvent.JOYSTICK_START);
            },
            onEnd: () => {
                this.emit(AppEvent.JOYSTICK_END);
            },
        });
        this._stage.addChild(this._joystick);
    }

    protected initRender(): void {
        this.initPIXI();
        this.initJoystick();
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
        this._renderer.render(this._stage);

        this.emit(AppEvent.RENDER);
    }

    public async load(images: AssetsConfig): Promise<void> {
        await this.loadImages(images);
    }

    protected async loadTextureFromImage(
        name: string,
        type: string | undefined,
        image: HTMLImageElement,
    ): Promise<void> {
        // TODO: PIXI texture creation
    }

    protected async loadImages(images: AssetsConfig): Promise<void> {
        return new Promise((resolve) => {
            let loadIndex = 0;
            const loadTotalIndex = images.length;

            const onLoad = async (
                name: string,
                type: string | undefined,
                image: HTMLImageElement | null,
            ): Promise<void> => {
                if (image) {
                    this._imageCache.set(name, image);
                    await this.loadTextureFromImage(name, type, image);
                }

                if (++loadIndex === loadTotalIndex) {
                    resolve();
                }
            };

            for (let i = 0; i < loadTotalIndex; i++) {
                const { name, data, type } = images[i];

                const image = new Image();

                image.onload = async () => {
                    await onLoad(name, type, image);
                    console.log(`App::loadImages() Loading success ${name}`);
                };
                image.onerror = () => {
                    onLoad(name, type, null);
                    console.error(`App::loadImages() Loading error ${name}`);
                };
                image.src = data;
            }
        });
    }

    protected onResize(): void {
        const { width, height } = this.getSize();

        const upscaleWidth = Math.ceil(1.5 * width);
        const upscaleHeight = Math.ceil(1.5 * height);

        this._renderer.view.style.width = width + "px";
        this._renderer.view.style.height = height + "px";
        this._renderer.view.width = upscaleWidth;
        this._renderer.view.height = upscaleHeight;
        this._renderer.resize(upscaleWidth, upscaleHeight);

        this.emit(AppEvent.RESIZE, width, height);
    }

    protected onOrientationChange = (): void => {
        this.onResize();
    };

    public getImage(name: string): HTMLImageElement | undefined {
        return this._imageCache.get(name);
    }

    public getTexture2d(name: string): Texture | undefined {
        return this._texture2dCache.get(name);
    }

    public getSize(): { width: number; height: number } {
        return { width: this.getWidth(), height: this.getHeight() };
    }

    public getWidth(): number {
        return Math.ceil(window.innerWidth);
    }

    public getHeight(): number {
        return Math.ceil(window.innerHeight);
    }

    public getRenderer(): AbstractRenderer {
        return this._renderer;
    }

    public getStage(): Container {
        return this._stage;
    }

    public getJoystick(): Joystick {
        return this._joystick;
    }
}
