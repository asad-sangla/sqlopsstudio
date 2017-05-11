# Backup Database

This document describes functional scenarios and details of database backup in Carbon. The goal is to allow users to

* Quickly create a backup of database as simple as click once using smart defaults. 
* Or configure more based on user's backp and recovery plan needs to maximize the full functional potential of backup.

* Backup is scriptable to run programmatically and /or to automate.

## Functional Pattern

Carbon's BACKUP page helps user to successfully backup database with minimum configurations with just a few clicks. The rest of configuration options are pre-set with smart defaults.

All other properties are initially hidden in 'Advanced' expandable section and the section is collapsed by default. To configure more, user can simply expand 'Advanced' section and change values.

Carbon provides nearly 1-1 mapping with T-SQL syntax so that user can script a complete T-SQL CREATE statement with a help of Carbon's BACKUP page.

> Configuration for 'tape' backup device functionality will not be enabled in the preview. Based on customer's feedback, 'tape' devive and related configuration options will be added.

> Azure SQLDB note: SQLDB backup is managed by the service. Carbon will provide Backup experience for on-prem or SQL instances on Azure VMs only.


## BACKUP Page / Dialog functionality

### Backup Information
Read-only insight information.

I CAN Scenarios

* I CAN get the insight of backup of current database based on its latest backup history.

BACKUP page displays the key insight about the latest backup on the database.

* Recent backup information
    * Type: Full / Deffirential / Transaction-Log / None
    * Backup datetime
        * None: indicates that database is not protected.
        * UTC backup finish datetime (should it be backup start time?)
    * Elapsed time: hh:mm:ss xxxx milliseconds

> design note: we would need to show the summary information for Full, Differential and Transaction-Log backup separately to provide more complete insight about the latest backup. When recovery SLA is in minutes interval, mostly likely the latestes backup information will be about Transaction-Log.

### Quick Backup

I CAN scenarios

* I CAN backup my database with just a few clicks with smart defaults.

BACKUP page provides the following configuration options.

* Backup name
    * Auto-generated name in the following format
        * database name-backupType-utcDateTime: e.g. ```WorldWideImporters-Differential-2017-05-10 12:04:02```
    * User can override the default value to a custom value.

* Recovery Model: read-only value from database. Full / Simple / Bulk-Logged.

* Backup type
    * User can select a backup type. Smart default value is **Full** backup.
    * Depending on the recovery model value, user can select one of following
    * recovery model: Full
        * Full
        * Differential
        * Transaction-Log
    * recovery model: Simple
        * Full
        * Differential
    * recovery model: Bulk-logged
        * Full
        * Differential
        * Transaction-Log

### Advanced

I CAN sceanarios

* I CAN easily configure complex backup options to meet my database backup and recovery plan requirements using Carbon.

* I CAN selectively backup all or part of filegroups and files in my database.

* I CAN configure one or more backup media files to maximize the performance and availability.

* I CAN browse the content of backup history information from media files.

* I CAN compress backup to increase the backup disk utilization, perforamnce and save storage cost.

* I CAN encrypt backup to meet compliance requirements.

* I CAN set backup expiration and easily clean up expired backups from media. 

BACKUP page provides the following configuration options under **Advanced** section.

* Backup component
    * Database: default
    * Files and Filegrouos: List of Filegroup and files. 
        * User can select file(s) to backup.
        * UX design request - need a UX design.

* Backup media
    * Backup media set name
        * Default value: existing media set name, read-only
        * Initial value: for the first backup for database, provide smart default in the following format database-backupset e.g. ```WorldWideImporers-MediaSet```
            * User can override the value.
            > add **new backup media set** dialog experience. It may require its own dialog. New backup media set dialog contains - Name, Description and Warning information that existing backups in the media set will be erased (FORMAT).
        * Check media set: On / **Off**
            * check the existence of media set
			> add user scenarios when to turn on check media set option
 
    * Description
    * Backup media type
        * Disk (default)
        * Azure Storage (URL) - not supported in **Carbon preview**

        > Backup azure storage container requires more investigation on non-windows OS. 

    * Backup media list
        * List of backup devices (disk file or Azure storage url)
        * Add 
            * Disk file - opens **remote file browser**
            * Azure Storage - **not supported in Carbon preview**
        * Remove
    * Content: display the content of backups in a specific media

        > design question: If we support this functionality, should it be its own dialog interface?

* Backup expiration
    * After: number of days
    * On: date-time-picker

* Compression: Server default / Yes / No

* Encryption: Yes / No
    * Algorithm: Algorithm enum
    * Certificate or Asymmetric Key: dropdown of existing certificates / asymmetric keys in master database (Server Certificate, Server Asymmetric Key).
    * Note that when user select Encryption option, reset the backup media set name and force user to recreate a new media set as the initiation of backup encryption requires a new media set (FORMAT).

* Verify backup: On / Off
* Perform checksum before writing to media: On / Off
* Continue backup on error: On / Off

* Truncate Transaction-Log: On / Off
    * Active only when the backup type is Transaction-Log

* Tape: **Not supported** in Carbon preview.


### Generate script & Backup action

I CAN scenarios

* I CAN generate backup script with all configured backup options.

* I CAN execute backup action against the current database. 

* I CAN view the progress of backup operation and its success / failure result. 

* When backup fails, I CAN re-open backup page with the all configured values, fix configuration option that caused failure and re-run backup.

    > design note: need to detail out the UX of re-open backup page with the previously configured options.


## References

[Best Practices - SAP](https://technet.microsoft.com/en-us/library/cc966447.aspx)

[MSDN Doc - Backup Restore](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/backup-overview-sql-server)

[Recovery Models](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/recovery-models-sql-server)

[Simple Recovery Model - When to use](https://www.mssqltips.com/sqlservertutorial/4/sql-server-simple-recovery-model)

[PITR (Point in Time Restore)](https://docs.microsoft.com/en-us/sql/relational-databases/backup-restore/restore-a-sql-server-database-to-a-point-in-time-full-recovery-model)

[Tailog backup] (http://www.sqlskills.com/BLOGS/PAUL/post/Disaster-recovery-101-backing-up-the-tail-of-the-log.aspx)

