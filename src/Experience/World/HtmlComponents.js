import Experience from "../Experience.js";
import { gsap } from "gsap";

export default class HtmlComponents {
    constructor() {
        this.experience = new Experience()
        this.params = this.experience.resources.items.config.camera
        this.info = document.querySelector('.info')
        this.pointerCircle = document.querySelector('.pointer-circle');
        this.pointer = document.querySelector('.pointer');
        this.overlay = document.querySelector('.overlay');
        this.navBar = document.querySelector('.navbar');
        this.menu = document.querySelectorAll('.nav');
        const burger = document.querySelector('.burger');
        const navLinks = document.querySelector('.nav-links');
        this.bindMenuToCamera(this.experience.camera, this.params.sections);

        burger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinks.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });

    }

    applyTemplate(template, data) {
        const tpl = Array.isArray(template) ? template.join('') : template;
        return tpl.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => data[key] ?? '');
    }

    addHighlight(data, htmlTemplates) {
        this.updateHtmlComponents(data, htmlTemplates);
        this.pointerCircle.style.width = "50px"
        this.pointerCircle.style.height = "50px"
        this.pointerCircle.style.border = "2px solid white"
    }

    clearHighlight() {
        this.info.style.opacity = '0';
        this.pointerCircle.style.width = "25px"
        this.pointerCircle.style.height = "25px"
        this.pointerCircle.style.border = "1px solid white"
    }

    updateHtmlComponents(data, template) {
        const tplString = Array.isArray(template) ? template.join('') : template;
        this.info.innerHTML = this.applyTemplate(tplString, data);
        this.info.style.opacity = 1
    }

    bindMenuToCamera(camera, sections) {
        if (!this.menu) return;

        this.menu.forEach(button => {
            button.addEventListener('click', () => {
                const sectionKey = button.dataset.section;
                const targetParams = sections[sectionKey];

                if (targetParams) {
                    camera.focus({
                        position: targetParams.position,
                        target: targetParams.target,
                        duration: 2,
                        ease: "power2.inOut"
                    });
                }
            });
        });
    }

    playIntro() {
        this.info.innerHTML = ""
        this.pointerCircle.style.display = "none"
        this.pointer.style.display = "none"
        gsap.to(this.overlay, {
            duration: this.params.introDuration,
            opacity: 0,
            onComplete: () => {
                this.overlay.style.display = 'none';
                this.navBar.style.display = 'flex'
                this.info.display = "block"
                this.pointerCircle.style.display = "block"
                this.pointer.style.display = "block"
            }
        })
    }

    destroy() {

        if (this.overlay) {
            gsap.killTweensOf(this.overlay);
        }

        if (this.debug?.active && this.debugFolder) {
            this.debugFolder.dispose();
            this.debugFolder = null;
        }

        this.pointerCircle = null;
        this.pointer = null;
        this.overlay = null;
        this.params = null;
        this.experience = null;
    }

}
