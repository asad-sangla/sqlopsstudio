# Project "Carbon": 5/30 Private Preview Demo

## Setting the stage (possibly a slide)
Quickly go over the state of art of Project "Carbon"

- **Punch-Through**
- **Alpha / Beta**

|State|Feature|Comment|
|:----------|:---|:---|
|Punch-through|MANAGE page and its content|Including object properties, tasks and management insights|
||Search in MANAGE page||
||CREATE DATABASE dialog||
||Backup dialog||
||Shell menus||
||Error messages||
||Any features related to PostgreSQL support||
|Alpha / Beta|Connection dialog|Including add / remove connections to Servers viewlet|
||Server Groups||
||Object Explorer|Including its folder structure and supported object types and supported actions e.g. SCRIPT AS|
||Edit Data||
||T-SQL Editor||
||Query Result views||

## Demo setup.

* This demo is setup on macOS running SQL Server 2017 on Ubuntu running in a docker container. Install docker container and setup SQL Server 2017 following the simple quide on https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-setup-docker

* Demo setup scripts are uploaded to [previewdemo git project](https://github.com/erickangMSFT/previewdemo).
    > Clone the repository to **~/Project/previewdemo** (this important since sqldump.sh script uses this folder. Otherwise, modifie sqldump.sh script to use your own folder)

* Install VSCode and mssql extension just for the demo prep.

* Run following commands.

    ```bash
    cd ~/Projects/previewdemo
    carbon .
    ```

* Creating **PreviewDemoDB**
    * open **~/Projects/previewdemo/initdb/create_previewdemodb.sql** in carbon editor

    * Connect to **localhost, master, sa**

    * Run create_previewdemodb.sql

* Prepare your dockercommands.sh

    * open **~/Projects/previewdemo/bash/dockercommands.sh** in carbon or vscode.

    * open Terminal and get docker container id by running ```docker ps```

    * update ```docker exec``` command in dockercommands.sh file docusing your docker container id

* Download settings.json from email (I will send it) and save it in the previewdemo folder.
    
    * note that settings.json contains MS internal server information and it will not be shared in the previewdemo git repo since it is public. 

## Demo Flow

### Install Carbon on macOS using .zip

*  Start carbon.app
    * By-pass GateKeeper warning    

### Start carbon in a light theme and demonstrate the portability of Carbon settings

* Show carbon's spash screen and initial experience that opens up Connection dialog with empty Servers viewlet.

* We have settings file that has all my server groups and connections definition.  I saved it from my PC to USB. Let's use that.

* Presse ``` Ctrl +  ` ``` to open Integrated Terminal in carbon then Run

    ```bash
    cat settings.json
    cp settings.json ~/Library/Application Support/Carbon/User
    ```
* Show that Carbon supports dark theme! Restart carbon to load server groups and connections.

* Show all server groups and connections are populated.

### Show Server Groups and Connections loaded from the settings file

* Expand **Tools Test Servers** and show different SQL Server versions starting from SQL Server 2008. 

* Mention that Carbon supports all supported version of SQL Servers on-prem and SQL Database and DW on Azure.

* Mention that Server Group is a first class citizen feature in Carbon. We plan to support CMS and running queries on a group level in future version.


### Add a group and connection

* Click **Add Server Group** button.

* Name it **Carbon Preview Servers** and set a color. Create a group.

* On **Carbon Preview Servers** group, open context menu and select **Add Connection** menu.

* Using connection dialog, add **localhost, master, sa** connection

### Connect to server

* Right mouseclick on the **localhost** connection on OE, click **Connect** menu to connect.

* On OE, show the list of databases. Show **PreviewDemoDB**

### Create a new database using mssql-scripter

* Mention about mssql-scripter private preview.

* Press ```CTRL+` ``` to open Integrated Terminial

* run following

    ```bash
    cat ./bash/sqldump.sh
    ```
* Show the mssql-scripter command

* run sqldump.sh

    ```bash
    ./bash/sqldump.sh
    ```

* do something while waiting for mssql-scripter finishes dumping database wihtout any progress indicator :)

* Open **File Explorer** show the files and mention that it is source controled with GIT.

* Open database_script.sql

* Mention that editor is powerd by VS Code.

* Show editor minimap: F1 --> 'settings' User Settings --> search 'mini' --> press Edit icon --> select True to turn on minimap.

* Click **Search** on Action Bar.

* Type in 'PreviewDemoDB' for Search word and press enter.

* Deselect all files except database_script.sql file.

* Type in 'CarbonDB' for Replace word

* Click the first match in the Search result to show the diff.

* Run **Replace** 

### Show Source Control (GIT)

* Highlight the badge notification on GIT icon on Action Bar.

* Click Source Control Icon

* Type 'Carbon demo' and commit the change.

* Mention that Carbon is integrated with source control


### Create database and database objects

* On Editor, click **Connect** button on Editor command bar.

* Connect to **localhost** using Recent History.

* Run database_script.sql


### Database Search.

* Show if the new database using MANAGE page.

* Go to MANAGE page.

* Click **localhost** on the breadcrumb.

* Show **CarbonDB** is listed on Search widget.

* Click **CarbonDB** to open its MANAGE page

* Show the Search widget of **CarbonDB** which lists up database objects.

* type in **table:** to filter the search result with table only. 

* explain about the search widget in contrast to OE's click and browse experience.


### Show Editor features.

* On the CarbonDB Manage page, click **New Query** task icon.

* Type 'sql' to list snippets, and select 'sqlListTablesAndViews'.

* Type the following statement using IntelliSense 

```

SELECT <list of columns>
FROM HumanResources.vEmployees

```

* Mouse over on ```vEmployees``` and click Peek Definition from context menu.

* Show Peek Definition.

### Edit Data and more Editor features.

* Go to OE and browse down to Tables

* On Person table, open contenxt menu and select **Edit Data**

* Change a column value such as First name and run.

* On the table, open context menu and select **SELECT Top 1000***

* **Show the reulst**.

* **Save as JSON**

### Show User defined snippet

* (TBD) type in 'my' to list user defined snippet. 

    > Have **backup status insight related snippet**.

* run the snippet.

* Click F1 to open command palette.

* Type in 'snippet' and select **Preferences:Open User Snippets** command.

* Show the user defined snippets.

### Backup part 1

* Go back to **CarbonPreviewDB** Manage page.

* Explain about Manage with Insight.

* Click **Backup** task. Tt requires remote file path.

### Open Integrated Terminial

26. Show ***cat dockercommand.sh***

27. Terminal into the docker container

28. ***CD /var/opt/mssql***

29. **ls** and **mkdir backup** folder

30 **readlink -f backup** to get the full path


### Backup part 2

31. Paste the file path to Backup page

32. Run backup

33. In the terminal, show the created backup file with **ls -l**


#

> review note on 5/26

Making a group as a starting point it is a first class citizen
- have multiple groups
- have groups with different version of servers
- show 2008 connection
- show 2016 connection
- sqltools2008, 2010, 2012, 2014, 2016

Working on simple - basic core properties to provide good experience. And comprehensive view without cluttering

run sqlcmd show it’s on docker / mac But showing more interesting

also using the sqltoolsservice
run mssql-scripter in integrated terminal and run the sql

- have a small db. RE mssql-scripter using it.
- open the sql, check it in, find and replace super heroe 2. 
- show the diff. check it in.
- create database using the script. 



## Post Demo - Areas that we need feedback


1. OE - Basic, Comprehensive, Custom view
    - It should be like survey like question and survey like answers.
		- What was the pain point of OE in SSMS?
		- What we have heard...
		- Proposed solution idea - Option 1. Show Basics only Option 2. Basic, Comprehensive and Custom View
		- Tell us whenever
##### cut		
	- Show settings.json pseudo code to change the mode and show / hide specific OE folder.
    - Show mockup of the result.
    - Show context menu mockup 
        - Explain configuration goes to MANAGE. Operations such as Restore, Failover stays in OE context menu.

2. Manage with Insight
    - Use Audit as an exmaple
    - Show how to configure Audit, Server Audit Spec and Database Audit Spec on OE in a disjoint flow with complexity
    - Show mockup of 
        - Compliance Insight
        - Audit configuration Action

    - Talk about possible Insights and Actions
    - Ask for contribution

3. Simple and Comprehensive object provisioning and manage concept
    - Show mockup of CREATE DATABASE with Simple and Advanced collapsible section.
    - Explain the simple and comprehensive concept.
    - Show Manage with ALTER Property mockup.

    - Talk about North-star of Recovery Plan builder that produces Agent job scripts as the final artifact.
