import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Picker {
    constructor() {
        this.experience = new Experience()
        this.renderer = this.experience.renderer.instance
        this.camera = this.experience.camera.instance
        this.sizes = this.experience.sizes
        this.scale = 0.5

        this.renderTarget = new THREE.WebGLRenderTarget(
            Math.ceil(this.sizes.width * this.scale),
            Math.ceil(this.sizes.height * this.scale)
        )
        this.scene = this.experience.pickingScene
        this.pixelBuffer = new Uint8Array(4);

    }

    pick() {

        const targetWidth = this.renderTarget.width;
        const targetHeight = this.renderTarget.height;

        const x = Math.floor(targetWidth / 2);
        const y = targetHeight - Math.floor(targetHeight / 2);

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
        this.renderer.readRenderTargetPixels(this.renderTarget, x, y, 1, 1, this.pixelBuffer);
        this.renderer.setRenderTarget(null);

        return this.pixelBuffer
    }

    resize() {
        this.renderTarget.setSize(
            Math.ceil(this.sizes.width * this.scale),
            Math.ceil(this.sizes.height * this.scale)
        )
    }

    destroy() {

        if (this.renderTarget) {
            this.renderTarget.texture.dispose();
            this.renderTarget.dispose();
            this.renderTarget = null;
        }

        if (this.scene) {
            this.scene.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                    if (child.material.map) child.material.map.dispose();
                }
            });
            this.scene.clear();
        }

        this.renderer = null
        this.camera = null
        this.sizes = null
        this.pixelBuffer = null
    }

}
