import Handlebars, { type HelperOptions } from "handlebars";

type ParamsT = string | number;

// common helpers
Handlebars.registerHelper(
    "eq",
    function (this: unknown, a: ParamsT, b: ParamsT) {
        return a === b;
    },
);

Handlebars.registerHelper(
    "ifCond",
    function (
        this: unknown,
        v1: ParamsT,
        operator: string,
        v2: ParamsT,
        options: HelperOptions,
    ) {
        switch (operator) {
            case "===":
                return v1 === v2 ? options.fn(this) : options.inverse(this);
            case "!==":
                return v1 !== v2 ? options.fn(this) : options.inverse(this);
            case "<":
                return v1 < v2 ? options.fn(this) : options.inverse(this);
            case ">":
                return v1 > v2 ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    },
);

export default Handlebars;
