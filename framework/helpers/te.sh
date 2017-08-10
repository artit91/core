rm -f $PROJECT_ROOT/src
if [ -n "$1" ]; then
    ln -s $PROJECT_ROOT/mock $PROJECT_ROOT/src;
else
    ln -s $PROJECT_ROOT/impl $PROJECT_ROOT/src;
fi
