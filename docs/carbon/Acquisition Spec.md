# Carbon Acquisition
This document describes the functional scenario of the acquistion experience of Carbon. 

For the first user experience of Carbon, see the [getting started spec](https://github.com/Microsoft/carbon/blob/master/docs/carbon/getting%20started.md)

## Scenarios
I CAN install and run Carbon on Windows, Mac, or Linux.

## Functional Details
### Supported Operating Systems
* Windows - Windows 7, 8, 10
* Mac - MacOS 10.9+
* Linux - Debian, Ubuntu, Red Hat, Redora, SUSE

### Discovery of Carbon
* [SQL Tools](https://docs.microsoft.com/en-us/sql/tools/command-prompt-utility-reference-database-engine) Docs page (6/30)
* Carbon Getting Started Web Page (9/30)

### Download
The Carbon download experience will mirror that of VS Code which currently has the following options:
* Windows (Windows 7,8,10 - [Carbon.zip](https://github.com/Microsoft/carbon))
* Linux (Debian, Ubuntu - [Carbon.deb](https://github.com/Microsoft/carbon) Red Hat, Fedora, SUSE - [Carbon.rpm](https://github.com/Microsoft/carbon))
* Mac (MacOS 10.9+- [Carbon.zip](https://github.com/Microsoft/carbon))

#### Windows
##### Installation
1. Download the Carbon installer for Windows. 
2. Once it is downloaded, run the installer (CarbonSetup-version.exe). This will only take a minute. 
3. By default, Carbon is installed under C:\Program Files (x86)\Microsoft Carbon for a 64-bit machine.

You can also find a Zip archive [here](https://github.com/Microsoft/carbon).

Note: .NET Framework 4.5.2 is required for Carbon. If you are using Windows 7, please make sure .NET Framework 4.5.2 is installed.

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

#### Mac
##### Installation
1. Download Carbon for Mac.
2. Double-click on the downloaded archive to expand the contents.
3. Drag Carbon.app to the Applications folder, making it available in the Launchpad.
4. Add Carbon to your Dock by right-clicking on the icon and choosing Options, Keep in Dock.

You can also find a Zip archive [here](https://github.com/Microsoft/carbon).

Note: .NET Framework 4.5.2 is required for Carbon. If you are using Windows 7, please make sure .NET Framework 4.5.2 is installed.

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

#### Linux
##### Installation
> Debian and Ubuntu based distributions
The easiest way to install for Debian/Ubuntu based distributions is to download and install the .deb package (64-bit) either through the graphical software center if it's available or through the command line with:

    $ sudo dpkg -i <file>.deb
    $ sudo apt-get install -f # Install dependencies

Installing the .deb package will automatically install the apt repository and signing key to enable auto-updating using the regular system mechanism. Note that 32-bit and .tar.gz binaries are also available on the [download page](https://github.com/Microsoft/carbon). 

The repository and key can also be installed manually with the following script:

    $ curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
    $ sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
    $ sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/carbon stable main" > /etc/apt/sources.list.d/vscode.list'

Then update the package cache and install the package using:

    $ sudo apt-get update
    $ sudo apt-get install code # or code-insiders

> RHEL, Fedora and CentOS based distributions
We currently ship the stable 64-bit Carbon in a yum repository, the following script will install the key and repository:

    $sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
    $ sudo sh -c 'echo -e "[code]\nname=Carbon\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/carbon.repo'

Then update the package cache and install the package using dnf (Fedora 22 and above):

    $ dnf check-update
    $ sudo dnf install carbon

Or on older versions using yum:

    $ yum check-update
    $ sudo yum install carbon

> openSUSE and SLE based distributions

The yum repository above also works for openSUSE and SLE based systems, the following script will install the key and repository:

    $ sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
    $ sudo sh -c 'echo -e "[code]\nname=Carbon\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ntype=rpm-md\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/zypp/repos.d/carbon.repo'

Then update the package cache and install the package using:

    $ sudo zypper refresh
    $ sudo zypper install carbon

> AUR package for Arch Linux
There is a community maintained Arch User Repository (AUR) package for [Carbon](https://www.github.com/Microsoft/carbon).

> Installing .rpm package manually
The [.rpm package (64-bit)](https://www.github.com/Microsoft/carbon) can also be manually downloaded and installed, however auto-updating won't work unless the repository above is installed. Once downloaded it can be installed using your package manager, for example with dnf:

    $ sudo dnf install <file>.rpm

Note that 32-bit and .tar.gz binaries are are also available on the [download page](www.github.com/Microsoft/carbon).

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

# SQL Tools Docs Page
## Download Carbon
Carbon is a lightweight but powerful multi-database management tool. It is available for Windows, macOS, and Linux. Carbon provides tools to configure, monitor, and manages instances of SQL Server and PostgreSQL from wherever you deploy it. Carbon provides tools to deploy, monitor, and upgrade the data-tier components, such as databases and data warehouses used by your applications, and to build queries and scripts.

We are excited to announce the public preview release of Carbon.

Carbon is free! Download it below!

* Windows (Windows 7,8,10 - [Carbon.zip](https://github.com/Microsoft/carbon))
* Linux (Debian, Ubuntu - [Carbon.deb](https://github.com/Microsoft/carbon) Red Hat, Fedora, SUSE - [Carbon.rpm](https://github.com/Microsoft/carbon))
* Mac (MacOS 10.9+- [Carbon.zip](https://github.com/Microsoft/carbon))

# Carbon Getting Started Web Page

Carbon is a lightweight but powerful multi-database management tool. It is available for Windows, macOS, and Linux. Follow this guide to begin using Carbon.

## Downloads
* Windows (Windows 7,8,10 - [Carbon.zip](https://github.com/Microsoft/carbon))
* Linux (Debian, Ubuntu - [Carbon.deb](https://github.com/Microsoft/carbon) Red Hat, Fedora, SUSE - [Carbon.rpm](https://github.com/Microsoft/carbon))
* Mac (MacOS 10.9+- [Carbon.zip](https://github.com/Microsoft/carbon))

## Carbon in Action
As a lightweight tool, Carbon helps you quickly and efficently manage your databases:
* Connect and manage your servers
* Edit data
* Monitor your databases
* etc.

## First Steps
To get he most out of Carbon, start by reviewing a few introductory topics:

[Intro Videos](https://github.com/Microsoft/carbon)
[Setup](https://github.com/Microsoft/carbon)
[Documentation](https://github.com/Microsoft/carbon)
[Why Carbon?](https://github.com/Microsoft/carbon)
