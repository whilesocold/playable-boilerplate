import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { App } from "./App";

export enum MeshMaterialType {
    LAMBERT,
    STANDART,
}

export type MeshMaterialAny = THREE.MeshLambertMaterial | THREE.MeshStandardMaterial;
export type MeshLambertMaterialParameters = THREE.MeshLambertMaterialParameters;
export type MeshStandartMaterialParameters = THREE.MeshStandardMaterialParameters;

export class App3d extends App {
    protected _canvas3d!: HTMLCanvasElement;

    protected _renderer3d!: THREE.WebGLRenderer;
    protected _camera3d!: THREE.PerspectiveCamera;
    protected _scene3d!: THREE.Scene;
    protected _rootGroup!: THREE.Group;

    protected _meshLoader!: GLTFLoader;

    protected _texture3dCache: Map<string, THREE.Texture> = new Map<string, THREE.Texture>();

    protected initTHREE(): void {
        const { width, height } = this.getSize();

        this._canvas3d = document.getElementById("canvas_three") as HTMLCanvasElement;
        this._canvas3d.width = width;
        this._canvas3d.height = height;

        this._camera3d = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
        this._camera3d.position.y = 5;
        this._camera3d.position.z = 10;
        this._camera3d.lookAt(new THREE.Vector3(0, 0, 0));

        this._renderer3d = new THREE.WebGLRenderer({
            canvas: this._canvas3d,
            antialias: true,
            alpha: true,
        });

        this._renderer3d.setSize(width, height);
        this._renderer3d.setClearColor(0xffffff, 0);

        document.getElementById("three")?.append(this._renderer3d.domElement);

        this._renderer3d.shadowMap.enabled = true;
        this._renderer3d.outputEncoding = THREE.sRGBEncoding;

        this._scene3d = new THREE.Scene();
        this._scene3d.background = new THREE.Color(0xffffff);

        this._rootGroup = new THREE.Group();
        this._scene3d.add(this._rootGroup);

        this._meshLoader = new GLTFLoader();
    }

    protected initRender(): void {
        super.initRender();

        this.initTHREE();
    }

    protected onRender(): void {
        this._renderer3d.render(this._scene3d, this._camera3d);

        super.onRender();
    }

    protected onResize(): void {
        super.onResize();

        const { width, height } = this.getSize();

        this._camera3d.aspect = window.innerWidth / window.innerHeight;
        this._camera3d.updateProjectionMatrix();

        this._renderer3d.setSize(1.5 * width, 1.5 * height);

        this._canvas3d.style.width = width + "px";
        this._canvas3d.style.height = height + "px";
        this._canvas3d.width = 1.5 * width;
        this._canvas3d.height = 1.5 * height;
    }

    public createSunLight(color = 0xffffff, intensity = 0.8, castShadow = true): THREE.DirectionalLight {
        const sunLight = new THREE.DirectionalLight(color, intensity);

        sunLight.position.set(30, 30, 10);
        sunLight.castShadow = castShadow;

        sunLight.shadow.camera.left = -5;
        sunLight.shadow.camera.right = 5;
        sunLight.shadow.camera.top = 5;
        sunLight.shadow.camera.bottom = -5;

        sunLight.shadow.mapSize.width = 1024;
        sunLight.shadow.mapSize.height = 1024;

        return sunLight;
    }

    public createAmbientLight(color = 0xffffff, intensity = 0.5): THREE.AmbientLight {
        return new THREE.AmbientLight(color, intensity);
    }

    public async createMesh(meshJsonStr: string): Promise<THREE.Group> {
        return new Promise((resolve, reject) => {
            this._meshLoader.parse(
                meshJsonStr,
                "",
                (gltf: GLTF) => resolve(gltf.scene),
                (event: ErrorEvent) => reject(event),
            );
        });
    }

    public async createMeshFromConfig(name: string, meshesConfig: any): Promise<THREE.Group> {
        return new Promise(async (resolve, reject) => {
            const meshConfig = meshesConfig.find((data: any) => data.name === name);
            if (meshConfig) {
                resolve(await this.createMesh(JSON.stringify(meshConfig.data)));
            } else {
                reject();
            }
        });
    }

    public createMaterial<T extends MeshLambertMaterialParameters | MeshStandartMaterialParameters>(
        type: MeshMaterialType = MeshMaterialType.LAMBERT,
        parameters: T,
    ): MeshMaterialAny | undefined {
        switch (type) {
            case MeshMaterialType.LAMBERT:
                return new THREE.MeshLambertMaterial(parameters);
                break;

            case MeshMaterialType.STANDART:
                return new THREE.MeshStandardMaterial(parameters);
                break;
        }
        return undefined;
    }

    protected async loadTextureFromImage(name: string, type: string, image: HTMLImageElement): Promise<void> {
        await super.loadTextureFromImage(name, type, image);

        const textureLoader = new THREE.TextureLoader();

        switch (type) {
            case "three":
                const texture = await textureLoader.loadAsync(image.src);

                texture.magFilter = THREE.NearestFilter;
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.flipY = false;
                texture.encoding = THREE.sRGBEncoding;

                this._texture3dCache.set(name, texture);
                break;
        }
    }

    public getTexture3d(name: string): THREE.Texture | undefined {
        return this._texture3dCache.get(name);
    }

    public getRenderer3d(): THREE.WebGLRenderer {
        return this._renderer3d;
    }

    public getScene(): THREE.Scene {
        return this._scene3d;
    }

    public getRootGroup(): THREE.Group {
        return this._rootGroup;
    }

    public getCamera(): THREE.Camera {
        return this._camera3d as THREE.Camera;
    }
}
