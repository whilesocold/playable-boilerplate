import { getWindow } from "../utils/getWindow";
import { EventEmitter } from "eventemitter3";

export enum MRAIDEvent {
    Complete = "MRAIDEvent.Complete",
    OrientationChange = "MRAIDEvent.OrientationChange",
}

export class MRAID extends EventEmitter {
    private mraid: any;

    constructor() {
        super();
        this.mraid = getWindow().mraid;
    }

    public init(): void {
        if (!this.mraid) {
            this.emit(MRAIDEvent.Complete);
            return;
        }

        try {
            if (this.mraid.getState() === "loading") {
                this.mraid.addEventListener("ready", this.onReady);
            } else {
                this.emit(MRAIDEvent.Complete);
            }
        } catch (e) {
            this.emit(MRAIDEvent.Complete);
        }
    }

    private onReady = (): void => {
        try {
            this.mraid.addEventListener("orientationchange", this.onOrientationChange);
            if (!this.mraid.isViewable()) {
                this.mraid.addEventListener("viewableChange", this.onViewable);
            }
        } catch (e) {}

        this.mraid.removeEventListener("ready", this.onReady);

        this.emit(MRAIDEvent.Complete);
    };

    private onViewable = (viewable: boolean): void => {
        if (viewable) {
            this.mraid.removeEventListener("viewableChange", this.onViewable);
        }
    };

    private onOrientationChange = (): void => {
        this.onOrientationChange();
    };
}
