const path = require('path');
const core = require('core');

const routes = 'lib/service'

module.exports = (baseDir) => {
    const routeUrl = path.join(baseDir, routes);

    let params = Array.prototype.slice.call(process.argv, 1);

    const servicePath = params[0];
    const service = servicePath.split('/').slice(-1).pop();
    const method = params[1];

    params = params.slice(2);

    const event = params.reduce((memo, act) => {
        const kv = act.split('=');
        memo[kv[0]] = decodeURIComponent(kv[1]);
        return memo;
    }, {});

    require(
        path.join(routeUrl, servicePath)
    )[service][method](event).then(
        (res) => {
            console.log(JSON.stringify(res, null, 2));
            process.exit(0);
        }
    ).catch((err) => {
        console.error(JSON.stringify(err, null, 2));
        process.exit(1);
    });
}
