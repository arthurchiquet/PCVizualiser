import * as THREE from 'three';
import Experience from '../Experience.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import vignetteVertex from '../Shaders/vignetteVertex.glsl';
import vignetteFragment from '../Shaders/vignetteFragment.glsl';

export default class Composer {
    constructor() {
        this.experience = new Experience();
        this.world = this.experience.world;
        this.params = this.experience.resources.items.config.composer;
        this.renderer = this.experience.renderer.instance;
        this.isMobile = this.experience.isMobile;
        this.sizes = this.experience.sizes;
        this.scene = this.experience.scene;
        this.debug = this.experience.debug;
        this.raycaster = new THREE.Raycaster();
        this.screenCenter = new THREE.Vector2(0, 0);

        this.camera = this.experience.camera.instance;

        this.composer = new EffectComposer(this.renderer);
        this.composer.renderTarget1.texture.encoding = THREE.sRGBEncoding;
        this.composer.renderTarget2.texture.encoding = THREE.sRGBEncoding;

        this.factor = this.isMobile ? 1.5 : 1;
        this.composer.setSize(this.sizes.width / this.factor, this.sizes.height / this.factor);
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.composer.setPixelRatio(pixelRatio);

        this.frameCount = 0; // compteur pour le throttling DOF
        this.updateInterval = 2; // tous les 2 frames

        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Post-Processing', expanded: false });
        }

        this.addRenderPass();
        this.addBloomPass();
        this.addFilmPass();
        // this.addDOFPass();
        this.addNoisePass();
        this.addVignettePass();
        this.addGammaCorrectionPass();
    }

    addRenderPass() {
        this.renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
    }

    addNoisePass() {
        const noiseShader = {
            uniforms: { tDiffuse: { value: null }, amount: { value: 0.05 } },
            vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
            fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float n = (fract(sin(dot(vUv.xy ,vec2(12.9898,78.233))) * 43758.5453) - 0.5) * amount;
      gl_FragColor = vec4(color.rgb + n, color.a);
    }
  `
        };
        const noisePass = new ShaderPass(noiseShader)
        this.composer.addPass(noisePass)
    }

    addBloomPass() {
        this.bloomFactor = this.isMobile ? 4 : 2;
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(this.sizes.width / this.bloomFactor, this.sizes.height / this.bloomFactor),
            this.params.bloomPass.strength,
            this.params.bloomPass.radius,
            this.params.bloomPass.threshold
        );
        this.composer.addPass(this.bloomPass);

        if (this.debug.active) {
            const bloomFolder = this.debugFolder.addFolder({ title: 'Bloom', expanded: false });
            bloomFolder.addBinding(this.bloomPass, 'strength', { label: 'Strength', min: 0, max: 5, step: 0.01 });
            bloomFolder.addBinding(this.bloomPass, 'radius', { label: 'Radius', min: 0, max: 2, step: 0.01 });
            bloomFolder.addBinding(this.bloomPass, 'threshold', { label: 'Threshold', min: 0, max: 1, step: 0.01 });
        }
    }

    addFilmPass() {
        this.filmPass = new FilmPass(this.params.filmPass.intensity.value);
        this.composer.addPass(this.filmPass);

        if (this.debug.active) {
            const filmFolder = this.debugFolder.addFolder({ title: 'Film', expanded: false });
            filmFolder.addBinding(this.filmPass.uniforms.intensity, 'value', { min: 0, max: 5 });
        }
    }

    addVignettePass() {
        const vignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                offset: { value: this.params.vignettePass.offset },
                darkness: { value: this.params.vignettePass.darkness }
            },
            vertexShader: vignetteVertex,
            fragmentShader: vignetteFragment
        };
        this.vignettePass = new ShaderPass(vignetteShader);
        this.composer.addPass(this.vignettePass);

        if (this.debug.active) {
            const vignetteFolder = this.debugFolder.addFolder({ title: 'Effet de bord', expanded: false });
            vignetteFolder.addBinding(this.vignettePass.uniforms.offset, 'value', { min: 0, max: 1 });
            vignetteFolder.addBinding(this.vignettePass.uniforms.darkness, 'value', { min: 0, max: 10 });
        }
    }

    addDOFPass() {
        this.dofPass = new BokehPass(this.scene, this.camera, {
            focus: this.params.bokehPass.focus,
            aperture: this.params.bokehPass.aperture,
            maxblur: this.params.bokehPass.maxblur,
            width: this.sizes.width,
            height: this.sizes.height
        });
        this.composer.addPass(this.dofPass);

        if (this.debug.active) {
            const DOFFolder = this.debugFolder.addFolder({ title: 'Profondeur de champ', expanded: false });
            DOFFolder.addBinding(this.dofPass.materialBokeh.uniforms['aperture'], 'value', { min: 0.00001, max: 0.01, format: (v) => v.toFixed(4) });
            DOFFolder.addBinding(this.dofPass.materialBokeh.uniforms['maxblur'], 'value', { min: 0, max: 0.1, format: (v) => v.toFixed(4) });
        }
    }

    addGammaCorrectionPass() {
        this.gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
        this.composer.addPass(this.gammaCorrectionPass);
    }

    resize() {
        this.composer?.setSize(this.sizes.width / this.factor, this.sizes.height / this.factor);
    }

    updateDOF(delta) {
        this.raycaster.setFromCamera(this.screenCenter, this.camera);
        const intersects = this.raycaster.intersectObject(this.world.terrain.mesh, true);

        if (intersects.length > 0 && this.camera.position.y < 15) {
            this.dofPass.enabled = true;
            this.dofPass.materialBokeh.uniforms['focus'].value =
                THREE.MathUtils.lerp(
                    this.dofPass.materialBokeh.uniforms['focus'].value,
                    intersects[0].distance,
                    0.1
                );
        } else {
            this.dofPass.enabled = false;
        }
    }

    update() {
        // const delta = this.experience.time.delta;

        // if (this.dofPass) {
        //     this.frameCount++;
        //     if (this.frameCount % this.updateInterval === 0) {
        //         this.updateDOF(delta);
        //     }
        // }

        this.composer?.render();
    }

    destroy() {
        this.composer?.passes.forEach(pass => {
            pass?.dispose?.();

            if (pass?.renderTarget) {
                pass.renderTarget.texture?.dispose();
                pass.renderTarget.dispose();
                pass.renderTarget = null;
            }

            if (pass?.renderTarget2) {
                pass.renderTarget2.texture?.dispose();
                pass.renderTarget2.dispose();
            }
        });

        this.composer?.reset();
        if (this.composer) this.composer.passes = [];
        this.composer = null;

        this.renderPass = null;
        this.bloomPass = null;
        this.filmPass = null;
        this.vignettePass = null;
        this.dofPass = null;

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose();
            this.debugFolder = null;
        }

        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.world = null;
        this.experience = null;
    }
}
