set -e

pushd `dirname $0` > /dev/null
export FW_ROOT=`pwd`
popd > /dev/null
export PROJECT_ROOT=$FW_ROOT/..

echo "2_1_clear"
sh $FW_ROOT/helpers/clear.sh
echo "2_2_transform_target"
sh $FW_ROOT/helpers/te.sh
echo "2_3_build_target"
sh $FW_ROOT/helpers/build.sh
