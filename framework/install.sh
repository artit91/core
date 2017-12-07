pushd `dirname $0` > /dev/null
export FW_ROOT=`pwd`
popd > /dev/null
export PROJECT_ROOT=$FW_ROOT/..

cd $FW_ROOT/2_target/express
npm install
cd $PROJECT_ROOT/impl
npm install
