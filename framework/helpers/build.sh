$PROJECT_ROOT/node_modules/.bin/tsc -p $PROJECT_ROOT/tsconfig.build.json --outDir $PROJECT_ROOT/build
ln -s $PROJECT_ROOT/src/node_modules $PROJECT_ROOT/build/src/node_modules