#!/bin/bash

cd $(dirname "$0") || return

pwd

docker-compose -f ./docker-compose.yaml up  --build --remove-orphans --force-recreate
docker-compose -f ./docker-compose.yaml down --volumes --remove-orphans

docker rmi -f $(docker image ls "*test-kevin-*"  --format "{{.ID}}")

docker volume prune -f
