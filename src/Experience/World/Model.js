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

        // Au lieu de setMesh directement, attendre le PLY
        if (this.resources.items.model) {
            this.setPLYMesh()
        }
    }

    setPLYMesh() {
        const geometry = this.resources.items.model
        console.log(geometry)
        if (!geometry) return console.warn('Le PLY n’a pas été chargé')

        // Créer le PointsMaterial
        this.material = new THREE.PointsMaterial({
            size: this.isMobile ? 0.05 : 3,
            vertexColors: true,
            sizeAttenuation: false
        })

        this.mesh = new THREE.Points(geometry, this.material)

        // Centrer le nuage
        geometry.computeBoundingBox()
        const center = geometry.boundingBox.getCenter(new THREE.Vector3())
        this.mesh.position.sub(center)

        // Rotation si nécessaire
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.scale.set(0.2, 0.2, 0.2);


        this.scene.add(this.mesh)

        // // debug pour la taille
        // if (this.debug?.active) {
        //     this.debugFolder.add(this.material, 'size', 0.01, 1, 0.01)
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
