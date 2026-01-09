import * as THREE from 'three'
import Experience from '../Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { gsap } from "gsap";

export default class Camera {
    constructor() {
        this.experience = new Experience()
        this.resources = this.experience.resources
        this.sizes = this.experience.sizes
        this.scene = this.experience.scene
        this.canvas = this.experience.canvas
        this.debug = this.experience.debug
        this.isMobile = this.experience.isMobile;

        this.cameraParams = this.resources.items.config.camera

        // Debug
        if (this.debug.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Camera & Controls', expanded: false })
        }

        this.setInstance()
        this.setControls()
        this.update()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(
            this.cameraParams.fov,
            this.sizes.width / this.sizes.height,
            this.cameraParams.near,
            this.cameraParams.far
        )

        this.instance.position.set(
            this.cameraParams.position.x,
            this.cameraParams.position.y,
            this.cameraParams.position.z
        )

        this.scene.add(this.instance)

        // Debug
        if (this.debug.active) {
            this.debugFolder.addBinding(this.instance.position, 'x', {
                readonly: true,
                label: 'Camera X',
            });

            this.debugFolder.addBinding(this.instance.position, 'y', {
                readonly: true,
                label: 'Camera Y',
            });

            this.debugFolder.addBinding(this.instance.position, 'z', {
                readonly: true,
                label: 'Camera Z',
            });

            const fovBinding = this.debugFolder.addBinding(
                this.instance, 'fov',
                {
                    label: 'Camera FOV',
                    min: 0,
                    max: 100,
                    step: 0.1
                }
            );

            fovBinding.on('change', () => {
                this.instance.updateProjectionMatrix();
            });

            const nearBinding = this.debugFolder.addBinding(
                this.instance, 'near',
                {
                    label: 'Camera near',
                    min: 0.01,
                    max: 10,
                    step: 0.01
                }
            );
            nearBinding.on('change', () => {
                this.instance.updateProjectionMatrix();
            });

            const farBinding = this.debugFolder.addBinding(
                this.instance, 'far',
                {
                    label: 'Camera far',
                    min: 1,
                    max: 2000,
                    step: 1
                }
            );
            farBinding.on('change', () => {
                this.instance.updateProjectionMatrix();
            });
        }

    }

    setControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
    }

    focus(params) {

        const offset = this.isMobile ? 2 : 0;

        const cam = {
            posX: this.instance.position.x,
            posY: this.instance.position.y,
            posZ: this.instance.position.z,
            tgtX: this.controls.target.x,
            tgtY: this.controls.target.y,
            tgtZ: this.controls.target.z
        };

        gsap.to(cam, {
            posX: params.position.x,
            posY: params.position.y + offset,
            posZ: params.position.z,
            tgtX: params.target.x,
            tgtY: params.target.y,
            tgtZ: params.target.z,
            duration: params.duration,
            ease: params.ease,
            onUpdate: () => {
                this.instance.position.set(cam.posX, cam.posY, cam.posZ);
                this.controls.target.set(cam.tgtX, cam.tgtY, cam.tgtZ);
                this.controls.update();
            }
        });
    }

    playIntro() {
        this.focus({
            position: {
                x: 4.5,
                y:4,
                z:11
            },
            target: this.cameraParams.sections.carte.target,
            duration: this.cameraParams.introDuration,
            ease: "power2.inOut"
        });
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update() {
        this.controls.update()
    }

    destroy() {
        // 1️⃣ Stop et supprime les controls
        if (this.controls) {
            this.controls.dispose()
            this.controls = null
        }

        // 2️⃣ Supprime la caméra de la scène
        if (this.instance) {
            this.scene.remove(this.instance)
            this.instance = null
        }

        // 4️⃣ Annule toutes les animations GSAP sur cette caméra
        gsap.killTweensOf(this.instance)

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose();
            this.debugFolder = null;
        }

        // 5️⃣ Supprime toutes les autres références
        this.experience = null
        this.resources = null
        this.sizes = null
        this.scene = null
        this.canvas = null
        this.debug = null
        this.cameraParams = null
    }

}
