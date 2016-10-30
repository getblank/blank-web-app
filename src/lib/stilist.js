function stilist(src) {
    const styles = {};

    for (let i = 1; i < arguments.length; i++) {
        const arg = arguments[i];
        if (!arg) continue;
        const argType = typeof arg;

        if (argType === "string" || argType === "number") {
            Object.assign(styles, src[arg]);
        } else if (Array.isArray(arg)) {
            Object.assign(styles, stilist.apply(null, [src, ...arg]));
        } else if (argType === "object") {
            for (let key of Object.keys(arg)) {
                if (arg[key]) {
                    Object.assign(styles, src[key]);
                }
            }
        }
    }
    return styles;
}

export default stilist;