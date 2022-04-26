# WaveScape Ignition Portal

This repository contains all of the code for the WaveScape Ignition Portal, the code for managing WaveScape runs, not the WaveScape code itself.  For that, you want the `wavescape` repository.

WaveScape Ignition documentation is available here:  https://pivotalcommware.atlassian.net/wiki/spaces/wavescape/pages/19196870911/Ignition

There are two different projects in this repository:

- `src/api` - All of the back-end APIs for the WaveScape Portal.  These are written in Python.  Current version is 3.9.x.
- `src/portal` - All of the code for the GUI.  This is React-based.

## Developer Instructions

### First-Time / Once
1. Install Docker, VSCode, and the "Remote - Containers" VSCode extension
1. Check out this repository and open it in VS Code
1. When prompted, reopen the project in the container and wait for this to complete
1. When VSCode opens, it will notice it has no `.venv` folder and will prompt you to create one; select "yes", pick the Python interpreter (version 3.9.x), and wait for this to complete
1. Change the `azurite.location` setting, either in the Azurite Extension's _Extension Settings_ or directly in the `/.vscode/settings.json` file - the value needs to be `"/workspaces/<repository name>/src/api/.azurite"`
1. Copy the file `local.settings.example.json` to `local.settings.json`

### To Run the Code
1. Open VS Code's Command Palate and select "Tasks: Run Task"

      1. Select "React: dependencies" (periodically, and each time dependencies change)
      1. Select "API: dependencies" (periodically, and each time dependencies change)
      1. Select "React: start"
      1. Select "API: start"
      1. Select "Portal: start", after starting React and the API (if you want to run both parts, front-end & back-end, together as the Static Web App (SWA))

### To Update Python:
(Caution: Do not update Python without first confirming that a more recent version is supported by the latest Azure components/extensions in use)

   1. Update the Python version in file "Dockerfile"
   1. Delete the `.../src/api/.venv` folder
   1. Exit and reopen VSCode, it will prompt to rebuild the Docker container, say "yes" and wait for this to complete
   1. When VSCode opens, it will notice it has no `.venv` folder and will prompt you to create one; select "yes", pick the Python interpreter (version to which you just switched), and wait for this to complete
   1. After VCCode finishes making the .venv folder:
      1. Run the "API: dependencies" Task and wait for it to complete
      1. Run the Command "Python: Restart Language Server"
   1. Update this README file with the new Python version information


## FAQ and Troubleshooting

### VSCode (running in the container) stops indicating the git status of the files you edit
For Windows users using SSH for BitBucket, follow the instructions here: https://code.visualstudio.com/docs/remote/containers#_using-ssh-keys
Which are:

1. Open a PowerShell window as Administrator
1. Enter `Set-Service ssh-agent -StartupType Automatic`
1. Enter `Start-Service ssh-agent`
1. Enter `Get-Service ssh-agent` (just to make sure it is running)
1. Enter `ssh-add $HOME/.ssh/id_rsa` (or wherever you put and named your rsa key)
