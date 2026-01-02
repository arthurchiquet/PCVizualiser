import Experience from './Experience.js'
import { throttle } from './Utils/Throttle.js'
import { gsap } from 'gsap'

export default class HighlightManager {
    constructor() {
        this.experience = new Experience()
        this.parameters = this.experience.resources.items.config
        this.matchingDict = this.experience.resources.items.matching
        this.highlightMesh = this.experience.world.highlightMesh
        this.htmlComponents = this.experience.world.htmlComponents
        this.camera = this.experience.camera.instance
        this.controls = this.experience.controls
        this.picker = this.experience.picker

        this.highlightThrottled = throttle(() => this.updateHighlight(), 50)

        this.controls.addEventListener('change', this.highlightThrottled)
    }


    updateHighlight() {

        const pickedColor = this.picker.pick();
        if (!pickedColor) {
            this.clearHighlight();
            return;
        }

        this.highlight(pickedColor);
    }

    highlight(color) {
        const hex = "#" + ((color[0] << 16) | (color[1] << 8) | color[2])
            .toString(16)
            .padStart(6, '0')
            .toLowerCase();

        const data = this.matchingDict[hex];

        if (data && this.camera.position.y <= 20) {

            this.htmlComponents.addHighlight(data, this.parameters.info);

            this.highlightMesh.material.uniforms.highlightColor.value.set(
                color[0] / 255,
                color[1] / 255,
                color[2] / 255
            );

            gsap.to(this.highlightMesh.material.uniforms.highlightAlpha, {
                value: 1,
                duration: 0.5,
                ease: "power1.out"
            })
        } else {
            this.clearHighlight();
        }
    }

    clearHighlight() {
        if (this.htmlComponents) this.htmlComponents.clearHighlight()

        if (this.highlightMesh) {
            // Alpha progressif pour disparition
            gsap.to(this.highlightMesh.material.uniforms.highlightAlpha, {
                value: 0,
                duration: 0.5,
                ease: "power1.out"
            })
        }
    }

    destroy() {
        if (this.controls && this.highlightThrottled) {
            this.controls.removeEventListener('change', this.highlightThrottled)
        }

        this.experience = null
        this.parameters = null
        this.matchingDict = null
        this.highlightMesh = null
        this.htmlComponents = null
        this.controls = null
        this.picker = null
        this.highlightThrottled = null
    }
}
