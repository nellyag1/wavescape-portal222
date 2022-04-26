#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | api-build.sh
# +----------------------------------------------------------------------------
set -e
cd $(dirname $0)/..
source ./bin/lib/helpers.bash

# cleanup
cd ./src/api
rm -f api.zip

# build
info "Building api package..."
pip install --target="./.python_packages/lib/site-packages" -r ./requirements.txt
zip api.zip -r * .python_packages

vsoOutput apiArtifact "src/api/api.zip"