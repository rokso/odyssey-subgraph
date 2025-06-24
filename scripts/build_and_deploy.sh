#!/bin/bash

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

NETWORK=""
DEPLOY_FLAG=""

while [[ $# -gt 0 ]]; do
    case "$1" in
    --network)
        NETWORK="$2"
        shift 2
        ;;
    --deploy)
        DEPLOY_FLAG="--deploy"
        shift
        ;;
    *)
        echo -e "${YELLOW}Usage: $0 --network [network_name] [--deploy]${NC}"
        exit 1
        ;;
    esac
done

if [[ -z "$NETWORK" ]]; then
    echo -e "${YELLOW}Usage: $0 --network [network_name] [--deploy]${NC}"
    exit 1
fi

# Dynamically get valid networks from config directory
VALID_NETWORKS=($(ls -1 config | grep -v '^[.]*$'))
if [[ ! " ${VALID_NETWORKS[@]} " =~ " $NETWORK " ]]; then
    echo -e "\n${RED}Unknown network: $NETWORK${NC}"
    echo -e "${YELLOW}Valid networks are: ${PURPLE}${VALID_NETWORKS[*]}${NC}\n"
    exit 1
fi

# Copy address.ts from config/<network> to src/utils
fromPath=config/$NETWORK/address.ts
toPath=src/utils/address.ts
echo -e "${CYAN}Preparing build for ${PURPLE}$NETWORK${NC}"
graph clean

echo -e "\n${YELLOW}Copying address file from:${NC} $fromPath ${YELLOW}to:${NC} $toPath"
cp "$fromPath" "$toPath"

# generate subgraph.yaml from template using network specific config
echo -e "${CYAN}Generating subgraph.yaml from template...${NC}"
mustache "config/$NETWORK/config.json" subgraph.template.yaml >subgraph.yaml

# generate code from graphql schema
echo -e "${CYAN}Running graph codegen...${NC}"
graph codegen

# deploy subgraph
if [[ "$DEPLOY_FLAG" == "--deploy" ]]; then
    echo -e "${CYAN}Deploying subgraph...${NC}"
    graph deploy --node https://api.studio.thegraph.com/deploy/
    echo -e "\n${GREEN}Deploy for ${PURPLE}$NETWORK ${GREEN}completed.${NC}\n"
else
    # build subgraph
    echo -e "${CYAN}Building subgraph...${NC}"
    graph build
    echo -e "${GREEN}Build for ${PURPLE}$NETWORK ${GREEN}completed.${NC}\n"
fi
