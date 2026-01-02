import Environment from './Environment.js'
import Terrain from './Terrain.js'
import HtmlComponents from './HtmlComponents.js'
import HighlightMesh from './HighlightMesh.js'
import PickingMesh from './PickingMesh.js'
import Content from './Content.js'
import Model from './Model.js'

export default class World {
    constructor() {
        this.model = new Model()
        this.environment = new Environment()
        // this.htmlComponents = new HtmlComponents()
        // this.highlightMesh = new HighlightMesh()
        // this.pickingMesh = new PickingMesh()
        // this.content = new Content()
    }

    destroy() {

        const modules = [
            this.model,
            this.environment,
            this.htmlComponents,
            this.highlightMesh,
            this.pickingMesh,
            this.content,
        ];

        modules.forEach(obj => {
            if (obj?.destroy) obj.destroy();
        });

        this.model = null;
        this.environment = null;
        this.htmlComponents = null;
        this.highlightMesh = null;
        this.pickingMesh = null;
        this.content = null;
    }
}
