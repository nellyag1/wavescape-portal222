###############################################################
# Base container with everything needed to run wavescape       
###############################################################
FROM python:3.9 AS base

ENV DEBIAN_FRONTEND=noninteractive

# update OS
RUN apt-get update \
    && apt-get -y dist-upgrade \
    && apt-get -y upgrade \
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

#################################
# dev container for VSCode
#################################
FROM base AS devcontainer

## install development tools
RUN apt-get update \
    && apt-get -y install \
        curl \
        direnv \
        git \
        gpg \
        jq \
        less \
        util-linux \
        libicu-dev \
        lsb-release \
        sudo \
        vim \
        python3-virtualenv \
        zip \
        zsh 

## install azure tooling
RUN curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor \
           > /etc/apt/trusted.gpg.d/microsoft.gpg \
    && export DEB_VERSION=$(lsb_release -rs | cut -d'.' -f 1) \
    && export AZ_REPO=$(lsb_release -cs) \
    && echo "deb [arch=amd64] https://packages.microsoft.com/debian/$DEB_VERSION/prod $AZ_REPO main" \
           > /etc/apt/sources.list.d/dotnetdev.list \
    && echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" \
           > /etc/apt/sources.list.d/azure-cli.list \
    && apt-get update \
    && apt-get -y install \
        azure-cli \
        azure-functions-core-tools-4 

## create VSCode user
ENV USERNAME vscode
RUN groupadd $USERNAME \
    && useradd -g $USERNAME -s /bin/zsh -m $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

## setup tools
USER vscode

# azure tools
RUN az extension add --name application-insights

# direnv
RUN mkdir -p /home/vscode/.config/direnv/ \
    && echo '[whitelist]\nprefix = [ "/workspace" ]' > /home/vscode/.config/direnv/config.toml

# nvm + node toolso
ENV NVM_DIR /home/vscode/.nvm
RUN (curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash) \
    && . /home/vscode/.nvm/nvm.sh \
    && nvm install 14 \
    && nvm alias default 14 \
    && nvm use 14 \
    && npm install -g \
        @azure/static-web-apps-cli


# zsh
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
ADD zshrc /home/vscode/.zshrc
RUN sudo chown vscode.vscode /home/vscode/.zshrc