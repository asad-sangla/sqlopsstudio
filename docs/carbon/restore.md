# Restore Database
This speclet describes the functional scenarios and detail of Restore Database experience.

## Goals

Using Carbon, developers and accidental DBAs can easily restore database from a given backup file(s) to the last backup state of database.

The key scenarios include:
* quick creation of database from a backup file.
* migrate database between server instance or cross-plat.
* support of database recovery from an incident and readiness fire-drill scenarios in backup and restore best practices.

### Backlogged SoW
The following features will be backlogged until the completion of Restore Database scenarios.

* Restore File and Filegroup
* Restore Page
* Restore from Azure blob storage (on macOS / Linux)

	> review note: we will work with vs code team to bring up the proper scenario and implementation and UX across board instead of building one-off mechanism.


## I CAN scenarios (Core)

> Developer Scenarios: M4

### I CAN easily create a new development / troubleshooting database from a backup file.

* The backup file usually contains a single full backup (set) in Full or Simple recovery model.
* The backup file can be a sample database backup file downloaded from a web site.
* The backup file can be taken from local or remote server.
* Create new database with move option to set database files to new location / file if the same file name exists.

> Disaster Recovery Scenarios: M5

### I CAN easily recover a database in unhealthy state from backup(s) made within the same sql server instance to the last backup time.

* Replace existing database
* Create new database with move option to set database files to new location / file if the same file name exists.
* Discover complete backups (set) and execute restore in sequence. (from msdb)
* Validate restore, backup and backup media requirements to complete restore action otherwise fail in the runtime.

sample full backup

```sql
declare @systime datetime = sysdatetime();
declare @backupfile varchar(126);
set @backupfile = N'C:\Temp\Backups\AdventureWorksFull-'
					+ convert(varchar(25), @systime, 112)
					+ N'-' + convert(varchar(2),Datepart(hour, @systime))
					+ N'-' + convert(varchar(2),DATEPART(minute, @systime))
					+ N'-' + convert(varchar(2),datepart(second, @systime))
					+ N'.bak'

BACKUP DATABASE [AdventureWorks]
TO  DISK = @backupfile
WITH FORMAT, INIT,
NAME = N'AdventureWorks-Full Database Backup',
STATS = 10, CHECKSUM
GO

```

sample: log backup

```sql
declare @systime datetime = sysdatetime();
declare @logfile varchar(126);
set @logfile = N'C:\Temp\Backups\AdventureWorks_Log-'
					+ convert(varchar(25), @systime, 112)
					+ N'-' + convert(varchar(2),Datepart(hour, @systime))
					+ N'-' + convert(varchar(2),DATEPART(minute, @systime))
					+ N'-' + convert(varchar(2),datepart(second, @systime))
					+ N'.bak'

BACKUP LOG [AdventureWorks]
TO  DISK = @logfile
WITH FORMAT, INIT,  NAME = N'AdventureWorks-log Database Backup',
STATS = 10
GO
```

check backup information
```sql

SELECT *
FROM msdb..backupset

SELECT *
FROM msdb..backupmediaset

SELECT *
FROM msdb..backupmediafamily

```
sample restore script to generate

```sql

USE [master]
BACKUP LOG [AdventureWorks] TO  DISK = N'C:\Temp\Backup\AdventureWorks_LogBackup_2017-06-20_12-56-08.bak' WITH NOFORMAT, NOINIT,  NAME = N'AdventureWorks_LogBackup_2017-06-20_12-56-08', NORECOVERY ,  STATS = 5, CONTINUE_AFTER_ERROR
RESTORE DATABASE [AdventureWorks] FROM  DISK = N'C:\Temp\Backups\AdventureWorksFull-20170620-11-43-52.bak' WITH  FILE = 1,  NORECOVERY,  NOUNLOAD,  STATS = 5
RESTORE LOG [AdventureWorks] FROM  DISK = N'C:\Temp\Backups\AdventureWorks_Log-20170620-11-44-14.bak' WITH  FILE = 1,  NORECOVERY,  NOUNLOAD,  STATS = 5
RESTORE LOG [AdventureWorks] FROM  DISK = N'C:\Temp\Backups\AdventureWorks_Log-20170620-11-44-17.bak' WITH  FILE = 1,  NORECOVERY,  NOUNLOAD,  STATS = 5
RESTORE LOG [AdventureWorks] FROM  DISK = N'C:\Temp\Backups\AdventureWorks_Log-20170620-11-44-18.bak' WITH  FILE = 1,  NOUNLOAD,  STATS = 5
GO

```

### I CAN easily recover a database in unhealthy state from backup(s) made from a remote sql server instance to the last backup time.

* Create new database with move option to set database files to new location / file if the same file name exists.
* Discover complete backups (set) and execute restore in sequence. (from backup file)
* Validate restore, backup and backup media requirements to complete restore action otherwise fail in the runtime.

### I CAN esaily make a tail-log backup to minimize any potential data loss

* tail-log backup can be made with Backup dialog using Transaction-log backup with continue on error option.

* available when the database recovery model is Full or Bulk-logged.


> PITR Scenarios - M6

### I CAN easily set the recovery point in time and restore database to the point in time.

* Easy to define STOPAT time. (visualization of time slider / time picker)
	* Visualization of backups in a time range

* Easy to understand the backup time and stopat time in the same date time format (discussion of UTC vs local server time)



## I CAN scenario (Northstar)

### I CAN easily browse the transaction content in transaction log file to determine the recovery point in time.

* Show, search and filter the list of transactions
* Selecting a transaction sets the stopat time.

sample
```json
/* Detection of STOPAT for TRUNCATE TABLE from transaction_log backup.
Transaction Begin Time for the problematic Truncate Table: 2017/05/12 02:44:11:947


SELECT  [Operation],
        [Begin Time],
        [Current LSN],
        [Transaction ID],
        [Transaction Name],
        [PartitionID],
        [TRANSACTION SID]
FROM fn_dump_dblog (NULL, NULL, N'DISK', 1, N'/var/opt/mssql/backup/SuperHeroDB_Log.bak',
DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT,
DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT,
DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT,
DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT,
DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT, DEFAULT)
WHERE [Transaction Name] IS NOT NULL;
*/

[
  {
    "Operation": "LOP_BEGIN_XACT",
    "Begin Time": "2017/05/12 02:43:59:503",
    "Current LSN": "00000024:00000158:0001",
    "Transaction ID": "0000:00000301",
    "Transaction Name": "INSERT",
    "PartitionID": null,
    "TRANSACTION SID": "0x01"
  },
  {
    "Operation": "LOP_BEGIN_XACT",
    "Begin Time": "2017/05/12 02:44:11:947",
    "Current LSN": "00000024:00000160:000c",
    "Transaction ID": "0000:00000304",
    "Transaction Name": "TRUNCATE TABLE",
    "PartitionID": null,
    "TRANSACTION SID": "0x01"
  }
]

```

## Functional Note

### Tape specific option handling:
Initial release of Carbon will not support Tape device. Tape device specific restore options will not be included in the T-SQL script that restore generates or executes.