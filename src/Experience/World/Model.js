import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Model {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.isMobile = this.experience.isMobile

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Model', expanded: false })
        }

        if (this.resources.items.model) {
            this.setPCDMesh()
        }
    }

    setPCDMesh() {

        this.mesh = this.resources.items.model

        // Centrer et scaler le nuage
        const bbox = new THREE.Box3().setFromObject(this.mesh)
        const center = bbox.getCenter(new THREE.Vector3())
        this.mesh.position.sub(center)

        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.scale.set(0.2, 0.2, 0.2)

        // Ajuster le material pour contrôle taille, blending, vertexColors
        this.mesh.material.map = this.resources.items.mask
        this.mesh.material.size = this.isMobile ? 0.05 : 0.1
        this.mesh.material.vertexColors = true
        this.mesh.material.sizeAttenuation = true
        this.mesh.material.blending = THREE.AdditiveBlending
        this.mesh.material.transparent = true
        this.mesh.material.depthWrite = false
        this.mesh.material.color.setScalar(1.5)

        this.scene.add(this.mesh)

        // Debug optionnel : modifier la taille en temps réel
        // if (this.debug?.active) {
        //     this.debugFolder.add(this.mesh.material, 'size', 0.01, 1, 0.01)
        // }
    }


    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh)
            this.mesh.geometry.dispose()
            this.mesh.material.dispose()
        }

        if (this.buildingsGroup) {
            this.scene.remove(this.buildingsGroup)
            this.buildingsGroup.traverse(child => {
                if (child.isMesh) {
                    child.geometry.dispose()
                    child.material.dispose()
                }
            })
        }

        if (this.textures) {
            Object.values(this.textures).forEach(t => {
                if (t instanceof THREE.Texture) t.dispose()
            })
        }

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose()
        }
    }
}
