#!/bin/bash
# +----------------------------------------------------------------------------
# | Copyright (c) 2022 Pivotal Commware
# | All rights reserved.
# | 
# | bootstrap.sh
# | Configures/sets up development environment
# +----------------------------------------------------------------------------

cd $(dirname $0)/..
set -e

# setup API
pushd src/api
    echo "Setting up Python virtual environment"
    python -m "venv" .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
popd

# setup Portal
pushd src/portal
    echo "Installing node dependencies"
    npm install
popd