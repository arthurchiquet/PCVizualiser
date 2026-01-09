import * as THREE from 'three'
import Experience from '../Experience.js'
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'
import particlesVertexShader from './../Shaders/particles/vertex.glsl'
import particlesFragmentShader from './../Shaders/particles/fragment.glsl'
import gpgpuParticlesShader from './../Shaders/gpgpu/particles.glsl'

export default class Model {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.resources = this.experience.resources
        this.time = this.experience.time
        this.debug = this.experience.debug
        this.sizes = this.experience.sizes

        if (this.resources.items.model) {
            this.setGeometry()
            this.setParticles()
        }
    }

    setGeometry() {
        const gltf = this.resources.items.model2
        let mesh = null

        gltf.scene.traverse((child) => {
            if (child.isMesh && !mesh) {
                mesh = child
            }
        })

        if (!mesh) {
            console.error("Aucun mesh trouvé dans le GLTF")
            return
        }
        
        this.baseGeometry = {}
        this.baseGeometry.instance = mesh.geometry
        this.baseGeometry.count = mesh.geometry.attributes.position.count
        /**
 * GPU Compute
 */
        // Setup
        this.gpgpu = {}
        this.gpgpu.size = Math.ceil(Math.sqrt(this.baseGeometry.count))
        this.gpgpu.computation = new GPUComputationRenderer(this.gpgpu.size, this.gpgpu.size, this.experience.renderer.instance)

        // Base particles
        const baseParticlesTexture = this.gpgpu.computation.createTexture()

        for (let i = 0; i < this.baseGeometry.count; i++) {
            const i3 = i * 3
            const i4 = i * 4

            // Position based on geometry
            baseParticlesTexture.image.data[i4 + 0] = this.baseGeometry.instance.attributes.position.array[i3 + 0]
            baseParticlesTexture.image.data[i4 + 1] = this.baseGeometry.instance.attributes.position.array[i3 + 1]
            baseParticlesTexture.image.data[i4 + 2] = this.baseGeometry.instance.attributes.position.array[i3 + 2]
            baseParticlesTexture.image.data[i4 + 3] = Math.random()
        }

        this.gpgpu.particlesVariable = this.gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
        this.gpgpu.computation.setVariableDependencies(this.gpgpu.particlesVariable, [this.gpgpu.particlesVariable])

        // Uniforms
        this.gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0)
        this.gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
        this.gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(baseParticlesTexture)
        this.gpgpu.particlesVariable.material.uniforms.uFlowFieldInfluence = new THREE.Uniform(0.5)
        this.gpgpu.particlesVariable.material.uniforms.uFlowFieldStrength = new THREE.Uniform(2)
        this.gpgpu.particlesVariable.material.uniforms.uFlowFieldFrequency = new THREE.Uniform(0.5)

        // Init
        this.gpgpu.computation.init()

        this.gpgpu.debug = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 3),
            new THREE.MeshBasicMaterial({ map: this.gpgpu.computation.getCurrentRenderTarget(this.gpgpu.particlesVariable).texture })
        )
        this.gpgpu.debug.position.x = 3
        this.gpgpu.debug.visible = false
        this.scene.add(this.gpgpu.debug)

    }

    setParticles() {
        this.particles = {}

        // Geometry
        const particlesUvArray = new Float32Array(this.baseGeometry.count * 2)
        const sizesArray = new Float32Array(this.baseGeometry.count)

        for (let y = 0; y < this.gpgpu.size; y++) {
            for (let x = 0; x < this.gpgpu.size; x++) {
                const i = (y * this.gpgpu.size + x);
                const i2 = i * 2

                // UV
                const uvX = (x + 0.5) / this.gpgpu.size;
                const uvY = (y + 0.5) / this.gpgpu.size;

                particlesUvArray[i2 + 0] = uvX;
                particlesUvArray[i2 + 1] = uvY;

                // Size
                sizesArray[i] = Math.random()
            }
        }

        this.particles.geometry = new THREE.BufferGeometry()
        this.particles.geometry.setDrawRange(0, this.baseGeometry.count)
        this.particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
        this.particles.geometry.setAttribute('aColor', this.baseGeometry.instance.attributes.color)
        this.particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))

        // Material
        this.particles.material = new THREE.ShaderMaterial({
            vertexShader: particlesVertexShader,
            fragmentShader: particlesFragmentShader,
            uniforms:
            {
                uSize: new THREE.Uniform(0.02),
                uResolution: new THREE.Uniform(new THREE.Vector2(this.sizes.width * this.sizes.pixelRatio, this.sizes.height * this.sizes.pixelRatio)),
                uParticlesTexture: new THREE.Uniform()
            }
        })

        // Points
        this.particles.points = new THREE.Points(this.particles.geometry, this.particles.material)
        this.scene.add(this.particles.points)
    }

    update() {
        this.particles.material.uniforms.uParticlesTexture.value = this.gpgpu.computation.getCurrentRenderTarget(this.gpgpu.particlesVariable).texture
    }


}
