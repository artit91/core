set -e
yarn test --json > /dev/null
yarn build --json > /dev/null
yarn runserver --json
