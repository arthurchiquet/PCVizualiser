import Environment from './Environment.js'
import Model from './Model.js'

export default class World {
    constructor() {
        this.environment = new Environment()
        this.model = new Model()
    }

    update() {
        // this.model.update()
    }

    destroy() {

        const modules = [
            this.model,
            this.environment,
        ];

        modules.forEach(obj => {
            if (obj?.destroy) obj.destroy();
        });

        this.model = null;
        this.environment = null;
    }
}
