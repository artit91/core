export NODE_PATH=$PROJECT_ROOT/build

if [ "$1" == "express" ]; then
    node -e "\
        require('source-map-support').install();\
        require('$FW_ROOT/2_target/express')('$NODE_PATH');\
    "
else
    node -e "\
        require('source-map-support').install();\
        require('$FW_ROOT/2_target/cli')('$NODE_PATH');\
    " ${@:2}
fi