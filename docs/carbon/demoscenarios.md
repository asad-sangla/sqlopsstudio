# Highfidelity Mockup Demo Scenarios

## Migration SQL Server database from Windows to Linux

Demonstrate the migration of database from Windows to Linux using core Carbon functionality and QDS insights.

1. Connect SQL Server 2008 R2 server running on Windows.
2. Browse and find AdventureWorks database on OE 
3. Backup AdventureWorks.
4. Using the integrated commandline in Carbon, connect to Docker container running SQL Server 2017 Ubuntu.
5. docker cp the backup file to the docker continer.
6. Connect to SQL Server 2017 on Docker.
7. Restore AdventureWorks.
8. Open MANAGE page for AdventureWorks.
9. Show compatibility - 100
10. Run application workload and verify no regression using QDS insights on MANAGE page.
11. Open Database Property edit page - change the compatibility to 140.

## Recovery of database with corrupted data file

Demonstrate recovery assurance insights and super easy experience to recover from an incident like damaged file. (for PITR show accidental drop / truncation of table).

SQL Server 2017 running on Linux with 20 databases - mix of mission critical and non-mission critical.

1. Connect to SQL Server instance
2. Open Server MANAGE page.
3. MANAGE page shows an at-a-glance view of recovery RPO and recovery readiness information about the database.
4. Simulate diaster - go to interactive terminal in Carbon, docker /bin/bash in and delete database's mdf file to make it corrupted.
5. Backto Server MANAGE page.
6. Shows the database with state insight - the damaged database should be in 'RECOVERY PENDING' with bright red mark.
7. On the database start Restore.
8. Restore page starts with timeslider showing insight about available backup to restore.
9. Crank the slider all the way to the right which will include the latest backup as well as tail-log backup.
10. Specify a new database 'database-recovered'
11. Recover in just a few clicks.
12. Show the recovered database content in OE using SELECT TOP 1000 rows from a table.


 