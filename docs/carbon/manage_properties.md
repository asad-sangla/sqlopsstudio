# Overview
This speclet describes the funcitonal requirements for Server and Database Properties on MANAGE dashboard.

## Goals

- Provide important properties for SQL Server and Databases on MANAGE-Property essentials widget for easy at-a-glance check.
- Provide comprehensive properties for SQL Server and Databases organized in a useful layout and grouping so that user can easily browse-n-find or search-with-keyword.
- Provide an easy way to modify properties for SQL Server and Databases then generate script or execute the change immediately.

## On-premises

### SQL Server

#### Essentials

|Property|Display Name|Comment|
|:---|:---|:---|
|SQL Server Version|Version||
|SQL Server Edition|Edition||
|Computer Name|Computer Name||
|OS Version|OS Version|Display in user friendly os name and version|

> note: detail out the display format of version information. i.e. user friendly format

### SQL Server Databases

#### Essentials
|Property|Display Name|Comment|
|:---|:---|:---|
|Recovery Model|Recovery Model||
|Last Database Backup|Last Database Backup|Date-time (UTC)|
|Last Log Backup|Last Log Backup|Date-time (UTC)|
|Compatibility Level |Compatibility Level||
|Owner|Owner||

## Azure

* Scoping principles
	- Carbon will display porperties that can be queried via T-SQL interface only (for the initial scope).
	- Displayed properties are read-only.
	- Manage actions are AZURE-CLI based.

### SQL Server on Azure

#### Essentials
|Property|Display Name|Comment|
|:---|:---|:---|


### SQL Database on Azure

#### Essentials
|Property|Display Name|Comment|
|:---|:---|:---|
|Server name|Server name||
|Pricing tier|Pricing tier||
|Edition|Edition||
|Owner|Owner||

sample lookup query
```sql
select
d.name,
o.service_objective,
o. edition,
d.create_date,
d.compatibility_level,
d.collation_name,
d.state_desc,
d.is_encrypted
from sys.databases d
join sys.database_service_objectives o on d.database_id = o.database_id
```

### SQL DW on Azure

#### Essentials

(TBD)

#

6/05 team discussion
Discussion note: (Kevin, Anthony, Eric)

- Carbon public preview & GA – scoping principle for Azure support
	- T-SQL interface only. Any feature that requires ARM / REST API is out of scope and backlog item for long term roadmap.
	- Eric to revise Azure SQL Server / DB property list scoped to T-SQL retrievable.
- Add ‘Manage’ context menu in OE to open Manage page to make it as user opt-in action.
	- Add settings option to set the default behavior – Manage, New Query
	- Add … to OE to indicate context menu is avail.
- Refresh and long loading time (a few seconds)
	- Based on #2, iteration 1 – no refresh, iteration 2 – manual, auto-refresh
- Overall Azure support: make Azure CLI available from integrated terminal.

