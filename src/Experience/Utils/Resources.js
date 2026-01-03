import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
import { PCDLoader } from 'three/addons/loaders/PCDLoader.js';
import EventEmitter from './EventEmitter.js'

export default class Resources extends EventEmitter {
    constructor(sources) {
        super()
        this.sources = sources
        this.items = {}
        this.loaders = {}
        this.setLoaders()

        // initialisation du niveau
        this.load()
    }

    // calcul du nombre total d'assets pour le niveau donné
    calculateTotalAssets() {
        return this.sources?.length || 0
    }

    // initialisation des loaders Three.js
    setLoaders() {
        this.loaders.textureLoader = new THREE.TextureLoader()
        this.loaders.gltfLoader = new GLTFLoader()
        this.loaders.plyLoader = new PLYLoader()
        this.loaders.pcdLoader = new PCDLoader()
        this.loaders.fileLoader = new THREE.FileLoader()
    }

    // méthode publique pour charger un nouveau niveau
    load() {
        this.loaded = 0
        this.toLoad = this.sources.length
        this.items = {}

        // barre de chargement
        this.loadingBar = document.querySelector(".loading-bar")
        if (this.loadingBar) {
            this.loadingBar.classList.remove('ended')
            this.loadingBar.style.transform = 'scaleX(0)'
        }

        this.startLoading()
    }

    // lancement du chargement de tous les assets
    startLoading() {
        for (const source of this.sources) {
            if (source.type === 'texture') {
                this.loaders.textureLoader.load(
                    source.path,
                    file => this.sourceLoaded(source, file),
                    undefined,
                    err => this.sourceError(source, err)
                )
            }
            else if (source.type === 'gltfModel') {
                this.loaders.gltfLoader.load(
                    source.path,
                    file => this.sourceLoaded(source, file),
                    undefined,
                    err => this.sourceError(source, err)
                )
            }
            else if (source.type === 'plyModel') {
                this.loaders.plyLoader.load(
                    source.path,
                    file => this.sourceLoaded(source, file),
                    undefined,
                    err => this.sourceError(source, err)
                )
            }
            else if (source.type === 'pcdModel') {
                this.loaders.pcdLoader.load(
                    source.path,
                    file => this.sourceLoaded(source, file),
                    undefined,
                    err => this.sourceError(source, err)
                )
            }
            else if (source.type === 'parameters') {
                this.loaders.fileLoader.setResponseType('json')
                this.loaders.fileLoader.load(
                    source.path,
                    file => this.sourceLoaded(source, file),
                    undefined,
                    err => this.sourceError(source, err)
                )
            }
        }
    }

    sourceLoaded(source, file) {
        this.items[source.name] = file
        this.incrementLoaded()
    }

    sourceError(source, error) {
        console.error(`❌ Erreur de chargement : ${source.path}`, error)

        // Fournir un fallback selon le type
        switch (source.type) {
            case 'texture':
                this.items[source.name] = new THREE.Texture() // texture vide
                break
            case 'gltfModel':
                this.items[source.name] = null // modèle manquant
                break
            case 'parameters':
                this.items[source.name] = {} // JSON vide
                break
        }

        this.incrementLoaded()
    }

    incrementLoaded() {
        this.loaded++

        if (this.loadingBar && this.loaded < this.toLoad) {
            this.loadingBar.style.transform = `scaleX(${this.loaded / this.toLoad})`
        }

        if (this.loaded === this.toLoad) {
            if (this.loadingBar) {
                this.loadingBar.classList.add('ended')
                this.loadingBar.style.transform = ''
            }
            this.trigger('ready')
        }
    }
}
