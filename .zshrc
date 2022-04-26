export BROWSER=none # disables react auto opening browser

# auto activate python if present
if [ -d "$WORKSPACE/src/api/.venv" ]; then
    source $WORKSPACE/src/api/.venv/bin/activate
fi
