import Environment from './Environment.js'
import Model from './Model.js'
import Model2 from './Model2.js'

export default class World {
    constructor() {
        this.model = new Model()
        this.environment = new Environment()
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
