# Carbon Acquisition

> 5/30 goal - Installation guide, Quick getting started guide.

This document describes the functional scenario of the acquistion experience of Carbon.

For the first user experience of Carbon, see the [getting started spec](https://github.com/Microsoft/carbon/blob/master/docs/carbon/getting%20started.md)

## Scenarios
I CAN install and run Carbon on Windows, Mac, or Linux.

## Functional Details for 5/30
### Supported Operating Systems
* Windows - Windows 7, 8, 10

> SSMS parity = Windows 10, Windows 8, Windows 8.1, Windows 7 (SP1), Windows Server 2016, Windows Server 2012 (64-bit), Windows Server 2012 R2 (64-bit), Windows Server 2008 R2 (64-bit)

* Mac - MacOS Sierra (10.12+)

* Linux - Ubuntu 16.04 and 16.10, Red Hat Enterprise Linux (RHEL) 7.3, OpenSUSE v12 SP2, SLES 12, Docker Engine 1.8+

### Discovery of Carbon
* Bits will be available on the [SQL Server Management Tools Yammer page](https://www.yammer.com/bpdtechadvisors/#/threads/inGroup?type=in_group&feedId=3903865&view=all)
* The bits will be in the form of tarball/zip files

Additional discovery/acquisition efforts:
* Demo in SQL on Linux Townhall (SQL Tools talk) on 5/25
* MVP webinar on 5/30

### Download
The Carbon download experience will intially be through file download on the SQL Server Management Tools Yammer page. The bits will be in the form of tarball/zip files as follows:
* Windows (Windows 7,8,10 - [Carbon.zip](https://github.com/Microsoft/carbon))
* Linux (Debian, Ubuntu - [Carbon.deb](https://github.com/Microsoft/carbon) Red Hat, Fedora, SUSE - [Carbon.rpm](https://github.com/Microsoft/carbon))
* Mac (MacOS 10.9+- [Carbon.zip](https://github.com/Microsoft/carbon))

#### Windows
##### Installation
1. Download the Carbon .zip file for Windows.
2. Once it is downloaded, unzip the file and run carbon.
> suggesgtion: xcopy based installation without requiring admin privilege to install setup.exe / msi.
> open question: what is the pre-req of carbon e.g. .NET core, VS-Code

You can also find a Zip archive [here](https://github.com/Microsoft/carbon).

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

#### Mac
##### Installation
1. Download Carbon for Mac.
2. Double-click on the downloaded archive to expand the contents.
3. Drag Carbon.app to the Applications folder, making it available in the Launchpad.
4. Add Carbon to your Dock by right-clicking on the icon and choosing Options, Keep in Dock.
5. Install openssl by running the following commands:

    $ brew install openssl
    $ ln -s /usr/local/opt/openssl/lib/libcrypto.1.0.0.dylib /usr/local/lib/
    $ ln -s /usr/local/opt/openssl/lib/libssl.1.0.0.dylib /usr/local/lib/

> Is .NET Core a pre-req?

You can also find a Zip archive [here](https://github.com/Microsoft/carbon).

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

#### Linux
##### Installation
> Red Hat Enterprise on Linux
* yum install
    * $ sudo yum install -y mssql-carbon
* Offline installation
    * $ sudo yum localinstall mssql-server_versionnumber.x86_64.rpm
> SUSE
* zypper install
    * $ sudo zypper install mssql-carbon
* Offline installation
    * $ sudo zypper install mssql-server_versionnumber.x86_64.rpm
> Ubuntu
* apt-get install
    * $ sudo apt-get update
    * sudo apt-get install -y mssql-server
* Offline installation
    * $ sudo dpkg -i mssql-server_versionnumber_amd64.deb

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

-----------
# Acquisition for 6/30 and Beyond

## Functional Details for 6/30+
### Supported Operating Systems
* Windows - Windows 7, 8, 10

> do we supprot win7. how about windows server 2012

> SSMS parity = Windows 10, Windows 8, Windows 8.1, Windows 7 (SP1), Windows Server 2016, Windows Server 2012 (64-bit), Windows Server 2012 R2 (64-bit), Windows Server 2008 R2 (64-bit)

* Mac - MacOS 10.9+

* Linux - Debian, Ubuntu, Red Hat, Redora, SUSE

> call out following Windows (64-bit only) - Windows 10 is recommended.
macOS
Ubuntu 14.04 / Linux Mint 17 / Linux Mint 18 / Elementary OS 0.3
**Ubuntu 16.04+** / Elementary OS 0.4
Debian 8.2
CentOS 7.1 / Oracle Linux 7
**Red Hat Enterprise Linux (RHEL)**
Fedora 23
**OpenSUSE 13.2**
**SLES - specify version**


### Discovery of Carbon
* [SQL Tools](https://docs.microsoft.com/en-us/sql/tools/command-prompt-utility-reference-database-engine) Docs page (6/30)
* Carbon Getting Started Web Page (9/30)

> for 5/30 private preview, download is from Yammer. We need get started page packaged up with the tarball/zip etc.


### Download
The Carbon download experience will mirror that of VS Code which currently has the following options:
* Windows (Windows 7,8,10 - [Carbon.zip](https://github.com/Microsoft/carbon))
* Linux (Debian, Ubuntu - [Carbon.deb](https://github.com/Microsoft/carbon) Red Hat, Fedora, SUSE - [Carbon.rpm](https://github.com/Microsoft/carbon))
* Mac (MacOS 10.9+- [Carbon.zip](https://github.com/Microsoft/carbon))

#### Windows
##### Installation
1. Download the Carbon installer for Windows.

> for 5/30, zip only. no exe setup installer.

2. Once it is downloaded, run the installer (CarbonSetup-version.exe). This will only take a minute.

> instruction to unzip and set path and run carbon

> suggesgtion: xcopy based installation without requiring admin privilege to install setup.exe / msi.

> for even GA, we may not want to have setup.exe / msi experience. (open question) will this work with enterprise WU / Windows Store experience? Key question is how to provide update / patch for enterprise users - for 6/30 and beyond.

> open question: what is the pre-req of carbon e.g. .NET core, VS-Code

3. By default, Carbon is installed under C:\Program Files (x86)\Microsoft Carbon for a 64-bit machine.

> this will be user's choice in xcopy install approach.


You can also find a Zip archive [here](https://github.com/Microsoft/carbon).


##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

> test functionality for 6/30 and beyond

#### Mac
##### Installation
1. Download Carbon for Mac.
2. Double-click on the downloaded archive to expand the contents.
3. Drag Carbon.app to the Applications folder, making it available in the Launchpad.
4. Add Carbon to your Dock by right-clicking on the icon and choosing Options, Keep in Dock.

> for 5/30 check if this works as described.

> who installs .NET Core? specify all pre-reqs and minimize pre-req. give instruction if user needs any action to install .NET core.

> give instruction for brew update
brew install openssl
ln -s /usr/local/opt/openssl/lib/libcrypto.1.0.0.dylib /usr/local/lib/
ln -s /usr/local/opt/openssl/lib/libssl.1.0.0.dylib /usr/local/lib/

You can also find a Zip archive [here](https://github.com/Microsoft/carbon).

> for each OS, specify how to uninstall Carbon.

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

#### Linux
##### Installation
> Debian and Ubuntu based distributions

The easiest way to install for Debian/Ubuntu based distributions is to download and install the .deb package (64-bit) either through the graphical software center if it's available or through the command line with:

    $ sudo dpkg -i <file>.deb
    > for 5/30 and Linux dist that does not have apt-get support.


    $ sudo apt-get install -f # Install dependencies

    > for 6/30 and beyond

    > refer to sql server installation docs.microsoft.com page and specify instruction per Linux dists.

Installing the .deb package will automatically install the apt repository and signing key to enable auto-updating using the regular system mechanism. Note that 32-bit and .tar.gz binaries are also available on the [download page](https://github.com/Microsoft/carbon).

The repository and key can also be installed manually with the following script:

    $ curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
    $ sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
    $ sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/carbon stable main" > /etc/apt/sources.list.d/vscode.list'

> refert to https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-setup-red-hat no GPG business.

Then update the package cache and install the package using:

    $ sudo apt-get update
    $ sudo apt-get install code # or code-insiders

> RHEL, Fedora and CentOS based distributions

We currently ship the stable 64-bit Carbon in a yum repository, the following script will install the key and repository:

    $sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
    $ sudo sh -c 'echo -e "[code]\nname=Carbon\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/carbon.repo'

> rpm --> yum

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
#### Windows
##### Installation
1. Download the Carbon installer for Windows.

> for 5/30, zip only. no exe setup installer.

2. Once it is downloaded, run the installer (CarbonSetup-version.exe). This will only take a minute.

> instruction to unzip and set path and run carbon

> suggesgtion: xcopy based installation without requiring admin privilege to install setup.exe / msi.

> for even GA, we may not want to have setup.exe / msi experience. (open question) will this work with enterprise WU / Windows Store experience? Key question is how to provide update / patch for enterprise users - for 6/30 and beyond.

> open question: what is the pre-req of carbon e.g. .NET core, VS-Code

3. By default, Carbon is installed under C:\Program Files (x86)\Microsoft Carbon for a 64-bit machine.

> this will be user's choice in xcopy install approach.


You can also find a Zip archive [here](https://github.com/Microsoft/carbon).


##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

> test functionality for 6/30 and beyond

#### Mac
##### Installation
1. Download Carbon for Mac.
2. Double-click on the downloaded archive to expand the contents.
3. Drag Carbon.app to the Applications folder, making it available in the Launchpad.
4. Add Carbon to your Dock by right-clicking on the icon and choosing Options, Keep in Dock.

> for 5/30 check if this works as described.

> who installs .NET Core? specify all pre-reqs and minimize pre-req. give instruction if user needs any action to install .NET core.

> give instruction for brew update
brew install openssl
ln -s /usr/local/opt/openssl/lib/libcrypto.1.0.0.dylib /usr/local/lib/
ln -s /usr/local/opt/openssl/lib/libssl.1.0.0.dylib /usr/local/lib/

You can also find a Zip archive [here](https://github.com/Microsoft/carbon).

> for each OS, specify how to uninstall Carbon.

##### Updates
Carbon ships monthly releases and supports auto-update when a new release is available. If you're prompted by Carbon, accept the newest update and it will be installed (you won't need to do anything else to get the latest bits). If you'd rather control Carbon updates manually, see How do I opt out of auto-updates.

#### Linux
##### Installation
> Debian and Ubuntu based distributions

The easiest way to install for Debian/Ubuntu based distributions is to download and install the .deb package (64-bit) either through the graphical software center if it's available or through the command line with:

    $ sudo dpkg -i <file>.deb
    > for 5/30 and Linux dist that does not have apt-get support.


    $ sudo apt-get install -f # Install dependencies

    > for 6/30 and beyond

    > refer to sql server installation docs.microsoft.com page and specify instruction per Linux dists.

Installing the .deb package will automatically install the apt repository and signing key to enable auto-updating using the regular system mechanism. Note that 32-bit and .tar.gz binaries are also available on the [download page](https://github.com/Microsoft/carbon).

The repository and key can also be installed manually with the following script:

    $ curl https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > microsoft.gpg
    $ sudo mv microsoft.gpg /etc/apt/trusted.gpg.d/microsoft.gpg
    $ sudo sh -c 'echo "deb [arch=amd64] https://packages.microsoft.com/carbon stable main" > /etc/apt/sources.list.d/vscode.list'

> refert to https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-setup-red-hat no GPG business.

Then update the package cache and install the package using:

    $ sudo apt-get update
    $ sudo apt-get install code # or code-insiders

> RHEL, Fedora and CentOS based distributions

We currently ship the stable 64-bit Carbon in a yum repository, the following script will install the key and repository:

    $sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc
    $ sudo sh -c 'echo -e "[code]\nname=Carbon\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/carbon.repo'

> rpm --> yum

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
Carbon is a lightweight but powerful multi-database management tool. It is available for Windows, macOS, and Linux. Carbon provides tools to configure, monitor, and manages instances of SQL Server from wherever you deploy it. Carbon provides tools to deploy, monitor, and upgrade the data-tier components, such as databases and data warehouses used by your applications, and to build queries and scripts.

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
