import Environment from './Environment.js'
import Content from './Content.js'
import Model from './Model.js'

export default class World {
    constructor() {
        this.model = new Model()
        this.environment = new Environment()
        // this.htmlComponents = new HtmlComponents()
        // this.content = new Content()
    }

    destroy() {

        const modules = [
            this.model,
            this.environment,
            this.htmlComponents,
            this.content,
        ];

        modules.forEach(obj => {
            if (obj?.destroy) obj.destroy();
        });

        this.model = null;
        this.environment = null;
        this.htmlComponents = null;
        this.content = null;
    }
}
