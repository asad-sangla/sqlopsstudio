# Carbon Backup Database

This document describes the functional scenarios and details of database backup in Carbon.


## UX story

### Funcitonal Scenarios

Reason to use resotre for DBA
- Recover database from damaged action on data
- Recreate a database from an archive
- Deploy an SQL server environment using a backup file

I CAN configure backup using Carbon and produce backup script.

I CAN configure backup using Carbon and run the backup for a database.


I CAN submit a long running backup task and close Carbon which will not interfere with the backup operation.

* Success case
* Failure case
* Showing the progress

> open question - how carbon can get the in-progress status of service side task. https://www.mssqltips.com/sqlservertip/2343/how-to-monitor-backup-and-restore-progress-in-sql-server/


I CAN see the backup history.


**Punch-through Implementation scope**
- Name of database | Current database as default
- Backup Type | Full by default
- Backup component | Database by default
- Destination | Disk by default
- Path | user configurable



> open question is there any sceanrio around backward compat


## Error handling

## Non-functional requirements

## Security considerations


## References

[Best Practices - SAP](https://technet.microsoft.com/en-us/library/cc966447.aspx)

[MSDN Doc - Backup Restore](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/backup-overview-sql-server)

[Recovery Models](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/recovery-models-sql-server)

[Simple Recovery Model - When to use](https://www.mssqltips.com/sqlservertutorial/4/sql-server-simple-recovery-model)

[PITR (Point in Time Restore)](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/restore-a-sql-server-database-to-a-point-in-time-full-recovery-model)




