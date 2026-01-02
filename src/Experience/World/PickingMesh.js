import * as THREE from 'three'
import Experience from '../Experience.js'
import pickingVertex from '../Shaders/pickingVertex.glsl';
import pickingFragment from '../Shaders/pickingFragment.glsl';

export default class PickingMesh {
    constructor() {
        this.experience = new Experience()
        this.resources = this.experience.resources

        this.pickingScene = this.experience.picker.scene
        this.setGeometry()
        this.setTextures()
        this.setMaterial()
        this.setMesh()
    }

    setGeometry() {
        const heightMap = this.resources.items.heightMap
        const aspectRatio = heightMap.image.naturalWidth / heightMap.image.naturalHeight;
        this.geometry = new THREE.PlaneGeometry(10 * aspectRatio, 10, 128, 128);
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
            },
            vertexShader: pickingVertex,
            fragmentShader: pickingFragment,
            transparent: true,
            depthWrite: true,
            depthTest: true,
        });
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.rotation.x = - Math.PI / 2
        this.mesh.position.y = 0.01;
        this.pickingScene.add(this.mesh)
    }

    destroy() {
        if (this.mesh) {
            this.pickingScene.remove(this.mesh);
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

        this.resources = null;
    }
}