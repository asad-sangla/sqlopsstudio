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

## Demo Flow

### Install Carbon on macOS using .zip

1. Start carbon.app
    * By-pass GateKeeper warning    

### Add the first connection and group

2. Using connection dialog, add **localhost, master, sa** connection

3. On OE, add a new server group, **CarbonPreview** using Add Server Group dialog

4. On OE, drag and drop the connection into CarbonPreview group.

### Connect to server

5. Right mouseclick on the **localhost** connection on OE, click **Connect** menu to connect.

6. On Manage page, click **localhost** breadcrumb to go to Server page.

7. Show the list of databases. 

### Create a new database

8. Click **Create Database** task icon on MANAGE

9. Create **CarbonPreviewDB** using CREATE DATABASE page. 

    * Talk about Simple and Comprehensive design concept. Say we will show mock-up after demo.

10. Click **localhost** breadcrumb.

11. Show **CarbonPreviewDB** is listed in the database search widget.

12. Double click to open MANAGE page for **CarbonPreviewDB**

    * Talk about Manage with Insight concept. Say we will show mock-up after demo.

### Create database objects

13. On **CarbonPreviewDB** MANAGE page, click NEW QUERY task.

14. Editor opens up with connection to **CarbonPreviewDB** 

15. Show File explorer and Git.

16. Open **carbonpreviewdb.sql** script that populates 10 tables with data, 5 view, 5 functions, 5 stored procedures and run the script.

17. Use snipet, show select statement with Peek Definition and IntelliSense.

18. On **CarbonPreviewDB** MANAGE page, search tables with **table:** command!! or a name part to show tables, views, functions and proc that have the same name part.

    * mention that each object type will have associated actions like SELECT Top 1000, Edit Data, SCRIPT AS etc.
	
Show settings.json as a way to have the setting portability.

### Show Editors 

Go to OE and browse down to Tables

19. On a table, open contenxt menu and select **Edit Data**

20. Change a column value and run.

21. On the table, open context menu and select **SELECT Top 1000***

22. **Show the reulst**.

23. **Save as JSON**

### Backup part 1

24. Go back to **CarbonPreviewDB** Manage page.

25. Click Backup it requires remote file path.

### Open Integrated Terminial

26. Show ***cat dockercommand.sh***

27. Terminal into the docker container

28. ***CD /var/opt/mssql***

29. **ls** and **mkdir backup** folder

30 **readlink -f backup** to get the full path


### Backup part 2

31. Paste the file path to Backup page

32. Run backup

33. on the terminal, show the backup file with **ls -l**

> review note

Making a group as a starting point it is a first class citizen
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
