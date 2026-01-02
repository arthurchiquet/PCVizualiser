import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.params = this.experience.resources.items.config.environment
        this.debug = this.experience.debug

        // Debug
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Environment', expanded: false })
        }

        this.setSunLight()
    }

    setSunLight() {
        this.ambientLight = new THREE.AmbientLight(
            this.params.ambientLight.color,
            this.params.ambientLight.intensity
        );

        this.scene.add(this.ambientLight)

        if (this.debug.active) {
            this.debugFolder.addBinding(
                this.ambientLight, 'intensity',
                {
                    label: 'Light Intensity',
                    min: 0,
                    max: 5,
                    step: 0.01
                }
            );
        }
    }

    destroy() {
        if (this.dirLight?.shadow?.map) {
            this.dirLight.shadow.map.dispose();
            this.dirLight.shadow.map = null;
        }

        if (this.ambientLight) {
            this.scene.remove(this.ambientLight);
            this.ambientLight = null;
        }

        if (this.dirLight) {
            this.scene.remove(this.dirLight);
            this.dirLight.target = null;
            this.dirLight = null;
        }

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose();
            this.debugFolder = null;
        }

        this.scene = null;
        this.params = null;
        this.debug = null;
        this.experience = null;
    }
}