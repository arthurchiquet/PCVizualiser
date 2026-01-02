import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Renderer {
    constructor() {
        this.experience = new Experience()
        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes

        if (!this.experience.experienceRenderer) {
            this.setInstance()
            this.experience.experienceRenderer = this
        } else {
            const existing = this.experience.experienceRenderer
            this.instance = existing.instance
        }

        this.scene = this.experience.scene
        this.camera = this.experience.camera
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            // antialias: false,
            powerPreference: 'high-performance'
        })
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = 1.2
        // this.instance.shadowMap.enabled = true
        // this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(this.sizes.pixelRatio)
    }

    update() {
        if (this.camera?.instance) {
            this.instance.render(this.scene, this.camera.instance)
        }
    }

    destroy() {
        if (this.instance) {
            // Libérer les ressources WebGL (textures, framebuffers, etc.)
            this.instance.dispose()

            // Optionnel : vider le canvas
            this.instance.forceContextLoss()
            this.instance.context = null
            this.instance.domElement = null
        }

        // Supprimer les références
        this.scene = null
        this.camera = null
        this.sizes = null
        this.canvas = null
        this.experience = null
        this.instance = null
    }
}
