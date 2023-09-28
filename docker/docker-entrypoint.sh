#!/bin/sh

# 如果命令行参数包含--server则启动server
# 如果命令行参数包含--web则启动web

# TEMP=`getopt -o swc:: --long server,web:,c-long:: -n 'example.bash' -- "$@"`
TEMP=`getopt -o swc:: --long server,web,c-long:: -n 'docker-entrypoint.sh' -- "$@"`
if [ $? != 0 ] ; then echo "Terminating..." >&2 ; exit 1 ; fi

eval set -- "$TEMP"

PWD=`pwd`
START_SERVER=0
START_WEB=0

while true; do
    case "$1" in
        -s|--server) START_SERVER=1 ; shift ;;
        -w|--web) START_WEB=1 ; shift ;;
        -c|--c-long)
            # c has an optional argument. As we are in quoted mode,
            # an empty parameter will be generated if its optional
            # argument is not found.
            case "$2" in
                "") echo "Option c, no argument"; shift 2 ;;
                *)  echo "Option c, argument \`$2'" ; shift 2 ;;
        esac ;;
        --) shift ; break ;;
        *) echo "Internal error!" ; exit 1 ;;
    esac
done

# exec "$@"
echo "pwd: $PWD"
if [ $START_SERVER == 1 ]
then
    echo "start server" && cd ./server
    echo `pwd`
    if [ $START_WEB == 1 ]
    then
        `npm run start&` && echo "server started"
    else
         npm run start
    fi
    cd ..
fi
if [ $START_WEB == 1 ]
then
    echo "start web" && cd ./web
    npm run start
    # if [ $START_SERVER == 1 ]
    # then
    #      `npm run start&` && echo "web started"
    # else
    #     npm run preview
    # fi
fi

echo "START_SERVER: $START_SERVER; START_WEB: $START_WEB"
echo "autojs-web-control started ..."