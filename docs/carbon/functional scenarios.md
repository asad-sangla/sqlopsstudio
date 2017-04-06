document version: 0.001 - initial draft in progress.

[//]:# (Leave your comment using comment syntax)
[//]:# (Author: Eric Kang)
[//]:# (Contributors: )

# What is Carbon

(Todo) One sentence to describe what is Carbon.

```
Carbon is a super duper handy dandy trusty musty database server and database manage and develop tool ...
```

# What I can do with Carbon

* Manage database servers
* Manage databases
* Manage data
* Develop scripts and applications in t-sql

**Manage database servers**
* manage actions
	* provision
		* logins
	* configure server settings
	* monitor server status
	* run server management tasks
	* troubleshoot server issues
	* script server management tasks
	* migrate server

* manage scope
	* single mssql server
	* single postgresql server (extensible to other vendors)
	* group of multiple mssql servers
	* group of multiple postgresql servers
	* group of multiple mssql and postgresql servers

**Manage databases**
* manage actions
	* provision & migration
	* configure database settings
	* monitor database status
	* run database management tasks
	* troubleshoot database issues
	* script database management tasks

* manage scope
	* single mssql database
	* single azure sql database
	* single postgresql database (extensible to other vendors)
	* group of multiple mssql databases
	* group of multiple azure sql databases (open question - elastic pool)
	* group of multiple postgresql databases
	* group of multiple mssql, azure sql and postgresql databases

**Manage data**
* manage actions
	* view data
	* edit data
	* import / insert data from csv, json, excel format etc.

* manage scope
	* table data

**Develop scripts and applcations in t-sql**

* develop actions
	* generate script
	* edit script
	* tune query performance
	* debug stored procedure

* develop scope
	* management task scripts
	* stored procedure and functions
	* any DML query
	* any monitoring script
	* any DDL script

# I CAN scenarios

## 1. Acquistion

#### I CAN install and run Carbon on Windows, MAC or Linux.

* Functional details
	* Supported OS matrix
	* Discovery of Carbon and download
	* Install and uninstall
	* Telemetry detail
	* Error handling and supportability

#### I CAN download and install extensions to expand Carbon with additional functionalities.

* Functional details
	* Discovery of extensions
		* Microsoft published
		* 3rd party published
	* Install and uninstall
	* Telemetry

* Non-funcitonal details
	* Strategy to entice 3rd-party extension development.
	* Strategy to provide a healthy ecosystem and business ground for 3rd-party extension developers.

## 2. Manage

#### I CAN manage single or multiple servers or databases (management resources).

* I CAN run a task on multiple servers simultaneously.

#### I CAN manage multiple types of databases such as sql server on any platform, postgresql etc.

#### I CAN manage resources as a single or multiple groups.

### Management Tasks

* Backup
* High Availability

### Common functionality

* I CAN connect to a single server or database.
* I CAN connect to all servers or databases in a group.

## 3. Develop

### Development Tasks

* I CAN discover schema of my database.

* I CAN view and edit data.

I CAN view the script of any server or database management actions in Carbon.

