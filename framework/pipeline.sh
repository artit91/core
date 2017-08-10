set -e

pushd `dirname $0` > /dev/null
export FW_ROOT=`pwd`
popd > /dev/null
export PROJECT_ROOT=$FW_ROOT/..

echo "1_test"
sh $FW_ROOT/1_test.sh
echo "2_target"
sh $FW_ROOT/2_target.sh
echo "3_run"
sh $FW_ROOT/3_run.sh $@
