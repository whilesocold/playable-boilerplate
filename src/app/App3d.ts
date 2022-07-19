import * as THREE from "three";

import { nullable } from "../utils/types";
import { App } from "./App";

export class App3d extends App {
    protected _canvas3d: nullable<HTMLCanvasElement>;
    protected _renderer3d: nullable<THREE.WebGLRenderer>;
    protected _camera3d: nullable<THREE.PerspectiveCamera>;
    protected _scene3d: nullable<THREE.Scene>;
    protected _rootGroup: nullable<THREE.Group>;

    protected initTHREE(): void {
        const { width, height } = this.getSize();

        this._canvas3d = document.getElementById("canvas_three") as HTMLCanvasElement;
        this._canvas3d.width = width;
        this._canvas3d.height = height;

        this._camera3d = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
        this._camera3d.position.y = 160;
        this._camera3d.position.z = 400;
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
    }

    protected initRender(): void {
        super.initRender();

        this.initTHREE();
    }

    protected onRender(): void {
        if (this._scene3d && this._camera3d) {
            this._renderer3d?.render(this._scene3d, this._camera3d);
        }
        super.onRender();
    }

    protected onResize(): void {
        super.onResize();

        const { width, height } = this.getSize();

        if (this._camera3d) {
            this._camera3d.aspect = window.innerWidth / window.innerHeight;
            this._camera3d.updateProjectionMatrix();
        }

        this._renderer3d?.setSize(1.5 * width, 1.5 * height);

        if (this._canvas3d) {
            this._canvas3d.style.width = width + "px";
            this._canvas3d.style.height = height + "px";
            this._canvas3d.width = 1.5 * width;
            this._canvas3d.height = 1.5 * height;
        }
    }

    public getRenderer3d(): nullable<THREE.WebGLRenderer> {
        return this._renderer3d;
    }

    public getScene(): nullable<THREE.Scene> {
        return this._scene3d;
    }

    public getRootGroup(): nullable<THREE.Group> {
        return this._rootGroup;
    }

    public getCamera(): nullable<THREE.Camera> {
        return this._camera3d as THREE.Camera;
    }
}
