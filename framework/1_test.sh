set -e

pushd `dirname $0` > /dev/null
export FW_ROOT=`pwd`
popd > /dev/null
export PROJECT_ROOT=$FW_ROOT/..

echo "1_1_clear"
bash $FW_ROOT/helpers/clear.sh
echo "1_2_lint"
bash $FW_ROOT/1_test/lint.sh
echo "1_3_transform_test"
bash $FW_ROOT/helpers/te.sh 1
echo "1_4_build_test"
bash $FW_ROOT/helpers/build.sh
echo "1_5_run_test"
bash $FW_ROOT/1_test/run.sh
