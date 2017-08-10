const express = require('express');
const path = require('path');
const file = require('file');
const bodyParser = require('body-parser');

const core = require('core');
const config = core.config('target.express');
const logger = new core.Logger('express');

const errorMap = require('./errorMap');
const labels = require('./labels');

const routes = 'lib/service'

module.exports = (baseDir) => {
    const app = express();
    const router = express.Router();
    const routeUrl = path.join(baseDir, routes);
    const jsonBodyParser = bodyParser.json();

    file.walkSync(
        routeUrl,
        (start, dirs, names) => {
            const curPath = start.replace(routeUrl, '');
            names.forEach((name) => {
                if (!name.endsWith('.js')) {
                    return;
                }
                const serviceName = name.replace('.js', '');
                const service = require(
                    path.join(start, name)
                )[serviceName];
                let curSubPath = path.join(curPath, serviceName);
                if (curSubPath[0] !== '/') {
                    curSubPath = `/${curSubPath}`;
                }
                for (let method of Object.getOwnPropertyNames(
                    service
                )) {
                    router.post(
                        path.join(curSubPath, method).toLowerCase(),
                        jsonBodyParser,
                        (req, res, next) => {
                            service[method](req.body).then(
                                result => res.end(JSON.stringify(result))
                            ).catch((err) => {
                                res.status(
                                    errorMap.messages[err.message] ||
                                    errorMap.codes[err.code] ||
                                    500
                                );
                                logger.debug(err.message, err);
                                if (labels[err.message]) {
                                    err.localeMessage = labels[err.message](err.msgParams);
                                }
                                res.end(JSON.stringify(err));
                            });
                        }
                    )
                }
            })
        }
    );

    app.use(router);

    app.listen(
        config.port,
        config.host,
        () => logger.info('Services started.')
    );
};
