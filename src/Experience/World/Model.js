import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Model {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.isMobile = this.experience.isMobile

        if (this.debug?.active) {
            this.debugFolder = this.debug.ui.addFolder({
                title: 'Model',
                expanded: false
            })
        }

        if (this.resources.items.model) {
            this.setPCDMesh()
        }
    }

    setPCDMesh() {
        this.mesh = this.resources.items.model

        // Centrage du nuage
        const bbox = new THREE.Box3().setFromObject(this.mesh)
        const center = bbox.getCenter(new THREE.Vector3())
        this.mesh.position.sub(center)

        // Orientation + scale
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.scale.set(5, 5, 5)

        // Sécurité texture
        const mask = this.resources.items.mask
        mask.flipY = false
        mask.needsUpdate = true

        // Material forcé (évite tout override du loader)
        this.mesh.material = new THREE.PointsMaterial({
            size: 0.01,
            map: mask,
            transparent: true,
            alphaTest: 0.5,
            vertexColors: true,
            sizeAttenuation: true,
            depthWrite: false
        })

        this.scene.add(this.mesh)

    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh)

            if (this.mesh.geometry) {
                this.mesh.geometry.dispose()
            }

            if (this.mesh.material) {
                this.mesh.material.dispose()
            }
        }

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose()
        }
    }
}
