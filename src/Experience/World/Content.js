import * as THREE from 'three';
import Experience from '../Experience.js';
import { gsap } from "gsap";

export default class Content {
    constructor() {
        this.experience = new Experience();
        this.scene = this.experience.scene;
        this.resources = this.experience.resources;
        this.camera = this.experience.camera.instance; // récupérer la caméra
        this.canvas = this.experience.canvas;
        this.debug = this.experience.debug;

        if (this.debug?.active) {
            this.debugFolder = this.debug.ui.addFolder({ title: 'Sections', expanded: false });
        }

        this.sectionsData = [
            { name: 'logo', texture: this.resources.items.logo, position: [0, 50, 0] },
            { name: 'carte', texture: this.resources.items.carte, position: [0, 18, 0] },
            { name: 'services', texture: this.resources.items.services, position: [-10, 2, 0] },
            { name: 'process', texture: this.resources.items.process, position: [10, 2, 0] },
            { name: 'apropos', texture: this.resources.items.apropos, position: [0, 2, 10] },
            { name: 'contact', texture: this.resources.items.contact, position: [0, 2, -10] }
        ];

        this.sprites = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.setSprites();
        this.setEvents();
    }

    setSprites() {
        this.sectionsData.forEach(section => {
            const material = new THREE.SpriteMaterial({
                map: section.texture,
                transparent: true
            });

            const sprite = new THREE.Sprite(material);
            sprite.position.set(...section.position);
            sprite.rotation.x = -Math.PI / 2;
            sprite.scale.set(2, 2, 1);
            sprite.center.set(0.5, 0.5);

            this.scene.add(sprite);
            this.sprites.push({ name: section.name, sprite, material });
        });
    }

    setEvents() {
        this.canvas.addEventListener('click', (event) => {
            // Normaliser la position de la souris entre -1 et 1
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // Cherche les intersections avec les sprites
            const intersects = this.raycaster.intersectObjects(this.sprites.map(s => s.sprite));

            if (intersects.length) {
                const clickedSprite = this.sprites.find(s => s.sprite === intersects[0].object);
                if (clickedSprite) {
                    console.log("Clique sur :", clickedSprite.name);

                    // Exemple : déclencher une action si c'est la carte
                    if (clickedSprite.name === 'carte') {
                        this.onCarteClick();
                    }
                }
            }
        });
    }

    onCarteClick() {
        const params = {
            "position": {
                "x": 0,
                "y": 10,
                "z": 0
            },
            "target": {
                "x": 0,
                "y": 0,
                "z": -0.01
            }
        }

        this.experience.camera.focus({
            position: params.position,
            target: params.target,
            duration: 3,
            ease: "power2.inOut"
        });


        const emissive =
            this.experience.world.terrain.material.uniforms.emissiveIntensity;

        gsap.killTweensOf(emissive);

        gsap.timeline()
            .to(emissive, {
                value: 0.3,
                duration: 1.5,
                ease: "power2.in",
            })
            .to(emissive, {
                value: 0,
                duration: 1,
                ease: "linear"
            });
    }

    destroy() {
        this.canvas.removeEventListener('click', this.setEvents);
        if (this.sprites.length) {
            this.sprites.forEach(item => {
                this.scene.remove(item.sprite);
                item.material.dispose();
            });
            this.sprites = [];
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
