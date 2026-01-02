import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Terrain {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.debug = this.experience.debug
        this.isMobile = this.experience.isMobile
        this.factor = this.isMobile ? 2 : 1

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Terrain', expanded: false })
        }

        this.setGeometry()
        this.setTextures()
        this.setMaterial()
        this.setMesh()
    }

    setGeometry() {
        const heightMap = this.resources.items.heightMap
        const aspectRatio = heightMap.image.naturalWidth / heightMap.image.naturalHeight

        this.geometry = new THREE.PlaneGeometry(
            10 * aspectRatio,
            10,
            256 / this.factor,
            256 / this.factor
        )
    }

    setTextures() {
        const maxAnisotropy = this.experience.renderer.instance.capabilities.getMaxAnisotropy()

        this.textures = {}

        this.textures.colorMap = this.resources.items.colorMap
        this.textures.colorMap.colorSpace = THREE.SRGBColorSpace
        this.textures.colorMap.minFilter = THREE.LinearMipmapLinearFilter
        this.textures.colorMap.magFilter = THREE.LinearFilter
        this.textures.colorMap.generateMipmaps = true
        this.textures.colorMap.anisotropy = maxAnisotropy

        this.textures.heightMap = this.resources.items.heightMap
        this.textures.heightMap.minFilter = THREE.LinearMipmapLinearFilter
        this.textures.heightMap.magFilter = THREE.LinearFilter
        this.textures.heightMap.generateMipmaps = true

        this.textures.alphaMap = this.resources.items.alphaMap
        this.textures.alphaMap.minFilter = THREE.LinearFilter
        this.textures.alphaMap.magFilter = THREE.LinearFilter

        this.textures.emissiveMap = this.resources.items.emissiveMap
        this.textures.emissiveMap.minFilter = THREE.LinearFilter
        this.textures.emissiveMap.magFilter = THREE.LinearFilter

        this.textures.noiseMap = this.resources.items.noiseMap
        this.textures.noiseMap.wrapS = THREE.RepeatWrapping
        this.textures.noiseMap.wrapT = THREE.RepeatWrapping
        this.textures.noiseMap.repeat.set(50, 50) // densité du coup de pinceau
    }

    setMaterial() {
        const matParams = this.resources.items.config.terrainMaterial

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                colorMap: { value: this.textures.colorMap },
                heightMap: { value: this.textures.heightMap },
                alphaMap: { value: this.textures.alphaMap },
                brush: { value: this.textures.noiseMap },
                displacementScale: { value: matParams.displacementScale },
                emissiveMap: { value: this.textures.emissiveMap },
                emissiveIntensity: { value: 0 },
                emissiveColor: { value: new THREE.Color(0xffffff) },
                fogColor: { value: new THREE.Color(this.resources.items.config.scene.backgroundColor) },
                fogNear: { value: this.resources.items.config.scene.fogNear },
                fogFar: { value: this.resources.items.config.scene.fogFar }
            },
            vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float vFogDepth;
        uniform sampler2D heightMap;
        uniform float displacementScale;

        void main() {
            vUv = uv;
            vNormal = normal;
            vec3 displacedPosition = position + normal * texture2D(heightMap, uv).r * displacementScale;
            vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            vFogDepth = -mvPosition.z; // profondeur dans la caméra
        }
    `,
            fragmentShader: `
        uniform sampler2D colorMap;
        uniform sampler2D alphaMap;
        uniform sampler2D brush;
        uniform sampler2D emissiveMap;
        uniform float emissiveIntensity;
        uniform vec3 emissiveColor;
        varying vec2 vUv;
        varying float vFogDepth;

        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;

        void main() {
            vec4 baseColor = texture2D(colorMap, vUv);

            // Effet "peinture" et bruit
            baseColor.rgb = floor(baseColor.rgb * 20.0) / 20.0;
            vec3 brushColor = texture2D(brush, vUv * 50.0).rgb;
            baseColor.rgb += brushColor * 0.05;

            // Alpha
            float alpha = texture2D(alphaMap, vUv).r;

            // Émissive
            vec3 emissive = texture2D(emissiveMap, vUv).rgb * emissiveColor * emissiveIntensity;

            // Fog
            float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
            vec3 finalColor = mix(baseColor.rgb + emissive, fogColor, fogFactor);

            gl_FragColor = vec4(finalColor, alpha);
}

    `,
            transparent: true,
            fog: true // important
        });


        if (this.debug.active) {
            this.debugFolder.addBinding(this.material.uniforms['displacementScale'], 'value', { min: 0, max: 5, format: (v) => v.toFixed(4) });
            const uniformsProxy = {
                emissiveColor: `#${this.material.uniforms.emissiveColor.value.getHexString()}`
            }

            this.debugFolder.addBinding(uniformsProxy, 'emissiveColor', { view: 'color' })
                .on('change', ev => this.material.uniforms.emissiveColor.value.set(ev.value))
        }
    }

    setMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.material)
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.position.y = 0
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        this.scene.add(this.mesh)
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
