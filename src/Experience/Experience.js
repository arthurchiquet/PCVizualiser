import * as THREE from 'three'
import Debug from './Utils/Debug.js'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import { isMobile } from './Utils/Device.js'
import Camera from './Core/Camera.js'
import Renderer from './Core/Renderer.js'
import Composer from './Core/Composer.js'
import World from './World/World.js'
import Picker from './Core/Picker.js'
import HighlightManager from './HighlightManager.js'
import Resources from './Utils/Resources.js'

import sources from './sources.js'

let instance = null

export default class Experience {
    constructor(_canvas) {
        // Singleton
        if (instance) {
            return instance
        }
        instance = this

        // Global access
        window.experience = this

        // Options
        this.canvas = _canvas

        this.debug = new Debug()
        this.resources = new Resources(sources)

        this.scene = new THREE.Scene()
        this.pickingScene = new THREE.Scene()

        this.initUtilities()
        this.resources.on('ready', () => {
            this.initScene()
            this.initCore()
            this.initWorld()
            this.load()
        })
    }

    initUtilities() {
        this.isMobile = isMobile();
        this.sizes = new Sizes()
        this.time = new Time()
    }

    load() {
        this.initEvents()
        this.playIntro()
        this.initInteractions()
    }

    initScene() {
        const sceneParams = this.resources.items.config.scene

        this.scene.background = new THREE.Color(sceneParams.backgroundColor)
        this.scene.fog = new THREE.Fog(
            sceneParams.backgroundColor,
            sceneParams.fogNear,
            sceneParams.fogFar
        )

        if (this.debug.active) {
            const sceneFolder = this.debug.ui.addFolder({ title: 'Scene', expanded: false })

            const bgProxy = { backgroundColor: `#${this.scene.background.getHexString()}` };
            sceneFolder.addBinding(bgProxy, 'backgroundColor').on('change', ev => {
                this.scene.background.set(ev.value);
            });

            sceneFolder.addBinding(sceneParams, 'fogNear', { min: 0, max: 50, step: 0.1 }).on('change', ev => {
                if (this.scene.fog) this.scene.fog.near = ev.value;
            });

            sceneFolder.addBinding(sceneParams, 'fogFar', { min: 0, max: 200, step: 1 }).on('change', ev => {
                if (this.scene.fog) this.scene.fog.far = ev.value;
            });
        }
    }

    initCore() {
        this.camera = new Camera()
        this.renderer = new Renderer()
        this.controls = this.camera.controls
        this.picker = new Picker()
    }

    initWorld() {
        this.world = new World()
    }

    initInteractions() {
        this.highlightManager = new HighlightManager()
    }

    initEvents() {
        this.composer = new Composer()
        this.sizes.on('resize', () => {
            this.resize()
        })

        this.time.on('tick', () => {
            this.update()
        })
    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
        this.picker.resize()
        this.composer.resize()
    }

    update() {
        this.camera.update()
        this.composer.update()
    }

    playIntro() {
        this.camera.playIntro()
        this.world.htmlComponents.playIntro()
    }

    destroy() {
        this.sizes.off('resize')
        this.time.off('tick')
        this.camera.destroy()
        this.composer.destroy()
        this.picker.destroy()
        this.highlightManager.destroy()
        this.world.destroy()

        // 4️⃣ Dispose des utilitaires Three.js
        if (this.camera?.controls) this.camera.controls.dispose()
        if (this.renderer?.instance) this.renderer.instance.dispose()
        if (this.composer?.composer) this.composer.composer.dispose()

        if (this.debug?.active) {
            this.debug.ui.dispose?.()
            this.debug.ui.destroy?.()
        }

        [this.scene, this.pickingScene].forEach(scene => {
            if (!scene) return;

            scene.traverse(obj => {
                // Meshes
                if (obj.isMesh) {
                    if (obj.geometry) obj.geometry.dispose()

                    if (obj.material) {
                        if (Array.isArray(obj.material)) {
                            obj.material.forEach(mat => {
                                mat.dispose()
                                if (mat.map) mat.map.dispose()
                            })
                        } else {
                            obj.material.dispose()
                            if (obj.material.map) obj.material.map.dispose()
                        }
                    }
                }

                // Textures directes sur l’objet
                if (obj.map) obj.map.dispose()
            })

            // Retirer tous les enfants de la scène
            while (scene.children.length > 0) {
                scene.remove(scene.children[0])
            }
        })
        
        this.renderer.destroy()

        this.scene = null
        this.pickingScene = null
        this.camera = null
        this.composer = null
        this.world = null
        this.picker = null
        this.highlightManager = null
        this.debug = null
        this.controls = null
        this.renderer = null
    }
}