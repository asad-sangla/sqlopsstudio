# Dashboard Insights

## Overview
This speclet describes the funcitonal requirements for Server and Database Insights on the MANAGE dashboard.

Terms:
> Insights - *actionable* Server and Database information 

> Troubleshooting insights - Server and Database information that are *relevant* and *actionable* when there is a health issue

> Daily metrics - Server and Database information that indicates health at-a-glance

## Goals
We strive to provide customers with:
1. Essential metrics to enable daily Server and Database management.
2. Troubleshooting insights to empower customers to easily solve Server and Datbase health issues.
3. Discovery options to allow customers to easily find management insights.
4. Customizable insight widgets to enable customers to effectively monitor their most desired insights.

- Essentials
    - Surface high priority daily insights and metrics about Servers and Databases on a MANAGE-Insights essentials widget for an easy at-a-glance health check.
- Troubleshooting 
    - Provide insights on troublehsooting metrics about Servers and Databases on a MANAGE-Insights widget for on-the-fly tasks relevant to health issues
- Discovery
    - Provide a comprehensive view of Server and Database insights organized in a useful layout and grouping so that the customer can easily browse or search.
- Customizable
    - Provide a simple way to modify insights for Servers and Databases

## Insights
### Performance Insights
- Essentials
    1. I CAN view an overview of my database states at-a-glance and act accordinly based on recommended tasks.
    - States:
        - 0 = ONLINE
            - Database is available for access. The primary filegroup is online, although the undo phase of recovery may not have been completed.
        - 1 = RESTORING 
            - One or more files of the primary filegroup are being restored, or one or more secondary files are being restored offline. The database is unavailable.
        - 2 = RECOVERING : SQL Server 2008 through SQL Server 2017
            - Database is being recovered. The recovering process is a transient state; the database will automatically become online if the recovery succeeds. If the recovery fails, the database will become suspect. The database is unavailable.
        - 3 = RECOVERY_PENDING : SQL Server 2008 through SQL Server 
            - SQL Server has encountered a resource-related error during recovery. The database is not damaged, but files may be missing or system resource limitations may be preventing it from starting. The database is unavailable. Additional action by the user is required to resolve the error and let the recovery process be completed.
        - 4 = SUSPECT 
            - At least the primary filegroup is suspect and may be damaged. The database cannot be recovered during startup of SQL Server. The database is unavailable. Additional action by the user is required to resolve the problem.
        - 5 = EMERGENCY : SQL Server 2008 through SQL Server 2017
            - User has changed the database and set the status to EMERGENCY. The database is in single-user mode and may be repaired or restored. The database is marked READ_ONLY, logging is disabled, and access is limited to members of the sysadmin fixed server role. EMERGENCY is primarily used for troubleshooting purposes. For example, a database marked as suspect can be set to the EMERGENCY state. This could permit the system administrator read-only access to the database. Only members of the sysadmin fixed server role can set a database to the EMERGENCY state.
        - 6 = OFFLINE : SQL Server 2008 through SQL Server 2017
            - Database is unavailable. A database becomes offline by explicit user action and remains offline until additional user action is taken. For example, the database may be taken offline in order to move a file to a new disk. The database is then brought back online after the move has been completed.

    - Actions: Actions are intelligent task recommendations that will appear in the tasks widget on the MANAGE dashboard based on the database state.
        - Online: "take database offline" task
        - Restoring: "task viewer" to see the status or database restore
        - Recovering: "task viewer" to see status of database recovery
        - Recovery Pending: a "database status repair" task opens an editor window which the user runs to reveal errors. T-SQL pre-populated:
            
                 ALTER DATABASE MyDB SET ONLINE
        [Source](https://social.msdn.microsoft.com/Forums/sqlserver/en-US/5260bdba-f9b8-4b24-a406-964d86914dde/databases-in-recovery-pending-state?forum=sqlkjmanageability)
        - Suspect: a "database status repair" task opens an editor window which the user runs to solve this issue. T-SQL pre-populated:
        
                EXEC sp_resetstatus [YourDatabase];
                ALTER DATABASE [YourDatabase] SET EMERGENCY
                DBCC checkdb([YourDatabase])
                ALTER DATABASE [YourDatabase] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
                DBCC CheckDB ([YourDatabase], REPAIR_ALLOW_DATA_LOSS)
                ALTER DATABASE [YourDatabase] SET MULTI_USER
        [Source](https://support.managed.com/kb/a398/how-to-repair-a-suspect-database-in-mssql.aspx)
        - Emergency:troubleshooting tasks (TBD)
        - Offline: "take database online"

    - Sample T-SQL code to fetch database state:
            
            SELECT database_state 
            FROM sys.databases; 
    
    For more information see this [link](https://docs.microsoft.com/en-us/sql/relational-databases/system-catalog-views/sys-databases-transact-sql)
    - UX Pattern: Heatmap
        - A heatmap concept will be used to visualize database state in a "database state" widget.
        - Information on the widget:
            - Title - "Database State Insights"
            - Heatmap with colored icon and numbers ([see iPhone unread badge](http://cdn.osxdaily.com/wp-content/uploads/2015/03/new-unread-messages-badge.jpg)) 
                - "Online" text with green database icon and number of databases with state = 0
                - "Restoring" text with yellow database icon and number of databases with state = 1
                - "Recovering" text with yellow database icon and number of databases with state = 2
                - "Recovery Pending" text red database icon and number of databases with state = 3
                - "Suspect" text red database icon and number of databases with state = 4  
                - "Emergency" text red database icon and number of databases with state = 5
                - "Offline" text red database icon and number of databases with state = 6