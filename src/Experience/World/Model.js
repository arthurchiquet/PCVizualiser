import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Model {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.isMobile = this.experience.isMobile

        if (this.resources.items.model) {
            this.setPCDMesh()
        }
    }

    setPCDMesh() {
        const geometry = this.resources.items.model.geometry; // Assure-toi que c'est un nuage de points
        const mask = this.resources.items.mask;

        // Vérification de la texture (mask flou circulaire)
        mask.flipY = false;
        mask.needsUpdate = true;

        // Ajout d'un attribut size par point pour variation aléatoire
        const positions = geometry.attributes.position;
        const sizes = new Float32Array(positions.count);
        for (let i = 0; i < positions.count; i++) {
            sizes[i] = 0.2 + Math.random() * 0.1; // min/max taille du splat
        }
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Material avec texture floue + blending additive
        const material = new THREE.PointsMaterial({
            size: 0.02,                  // taille par défaut
            map: mask,                // texture floue circulaire
            transparent: true,
            alphaTest: 0.05,
            depthWrite: false,
            sizeAttenuation: false,
            vertexColors: true,
            // color: new THREE.Color(0xffffff)
        });

        // Création du nuage de points
        this.mesh = new THREE.Points(geometry, material);

        // Centrage et orientation
        const bbox = new THREE.Box3().setFromObject(this.mesh);
        const center = bbox.getCenter(new THREE.Vector3());
        this.mesh.position.sub(center);
        this.mesh.rotation.x = -Math.PI;
        this.mesh.scale.set(3, 3, 3);

        // Ajout à la scène
        this.scene.add(this.mesh);
    }

    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh)
            if (this.mesh.geometry) this.mesh.geometry.dispose()
            if (this.mesh.material) this.mesh.material.dispose()
        }

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose()
        }
    }
}
