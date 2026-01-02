import * as THREE from 'three'
import Experience from '../Experience.js'
import highlightVertex from '../Shaders/highlightVertex.glsl';
import highlightFragment from '../Shaders/highlightFragment.glsl';

export default class HighlightMesh {
    constructor() {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.scene = this.experience.scene
        this.debug = this.experience.debug

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Highlight', expanded: false })
        }

        this.setGeometry()
        this.setTextures()
        this.setMaterial()
        this.setMesh()
    }

    setGeometry() {
        const heightMap = this.resources.items.heightMap
        const aspectRatio = heightMap.image.naturalWidth / heightMap.image.naturalHeight;
        this.geometry = new THREE.PlaneGeometry(10 * aspectRatio, 10, 256, 256);
    }

    setTextures() {
        this.textures = {}
        this.textures.mask = this.resources.items.pickingMap
        this.textures.heightMap = this.resources.items.heightMap

    }

    setMaterial() {
        const matParams = this.resources.items.config.terrainMaterial

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                maskTexture: { value: this.textures.mask },
                displacementMap: { value: this.textures.heightMap },
                displacementScale: { value: matParams.displacementScale },
                displacementBias: { value: matParams.displacementBias },
                highlightColor: { value: new THREE.Vector3(0, 0, 0) },
                highlightAlpha: { value: matParams.highlightAlpha },
                highlightOutputColor: { value: new THREE.Color(matParams.highlightColor) }
            },
            vertexShader: highlightVertex,
            fragmentShader: highlightFragment,
            transparent: true,
            depthWrite: true
        });

        if (this.debug.active) {
            const uniformsProxy = {
                highlightAlpha: this.material.uniforms.highlightAlpha.value,
                highlightColor: `#${this.material.uniforms.highlightOutputColor.value.getHexString()}`
            }

            this.debugFolder.addBinding(uniformsProxy, 'highlightAlpha', { min: 0, max: 2, step: 0.01 })
                .on('change', ev => this.material.uniforms.highlightAlpha.value = ev.value)

            this.debugFolder.addBinding(uniformsProxy, 'highlightColor', { view: 'color' })
                .on('change', ev => this.material.uniforms.highlightOutputColor.value.set(ev.value))
        }
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.rotation.x = - Math.PI / 2
        this.mesh.position.y = 0.02;
        this.scene.add(this.mesh)
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }

        if (this.geometry) {
            this.geometry.dispose();
            this.geometry = null;
        }

        if (this.material) {
            this.material.dispose();
            this.material = null;
        }

        if (this.textures) {
            for (const key in this.textures) {
                if (this.textures[key] instanceof THREE.Texture) {
                    this.textures[key].dispose()
                }
            }
            this.textures = null
        }

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose();
            this.debugFolder = null;
        }

        this.scene = null;
        this.resources = null;
        this.debug = null;
        this.experience = null;
    }
}