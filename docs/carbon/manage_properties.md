# Overview
This speclet describes the funcitonal requirements for Server and Database Properties on MANAGE dashboard.

## Goals

- Provide must-know properties for SQL Server and Databases on MANAGE-Property essentials widget for easy at-a-glance check.
- Provide comprehensive properties for SQL Server and Databases organized in a useful layout and grouping so that user can easily browse-n-find or search-with-keyword.
- Provide an easy way to modify properties for SQL Server and Databases then generate script or execute the change immediately.

## On-prem

### SQL Server

#### Essentials


|Property|Display Name|Comment|
|:---|:---|:---|
|SQL Server Version|Version||
|SQL Server Edition|Edition||
|Computer Name|Computer Name||
|OS Version|OS Version|Display in user friendly os name and version|
|Compatibility Level|Compatibility Level||

### SQL Server Databases

#### Essentials
|Property|Display Name|Comment|
|:---|:---|:---|
|Database State|Status|e.g. Online, Offline, Suspect, Recovery Pending etc|
|Recovery Model|Recovery Model||
|Last Database Backup|Last Database Backup|Date-time (UTC)|
|Last Log Backup|Last Log Backup|Date-time (UTC)|
|Compatibility Level |Compatibility Level||
|Owner|Owner||

## Azure

### SQL Server on Azure

#### Essentials
|Property|Display Name|Comment|
|:---|:---|:---|
|Resource group|Resource group||
|Status|Status||
|Location|Location||
|Subscription ID|Subscription ID||
|Auditing|Auditing||


### SQL Database on Azure

#### Essentials
|Property|Display Name|Comment|
|:---|:---|:---|
|Resource group|Resource group||
|Status|Status||
|Location|Location||
|Server name|Server name||
|Pricing tier|Pricing tier||
|Subscription ID|Subscription ID||

### SQL DW on Azure

#### Essentials