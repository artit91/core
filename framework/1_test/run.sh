export NODE_PATH=$PROJECT_ROOT/build
find $PROJECT_ROOT/build/test -type f -name "*.test.js" -print0 \
    | xargs -P 10 -n 1 -0 -I {} \
        node -e "require('source-map-support').install(); require('{}')" || exit 1;