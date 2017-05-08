# Create Page: Database and DB Object Provisioning
This speclet describes CREATE functionality in Carbon. The goal is to allow users to:

* Quickly create database and db objects with a minimum effort.
* Or configure more properites to maximize the full functional potential of db / db objects in SQL server.

* All CREATE actions are scriptable to run programmatically and / or to automate.

## Functional Pattern

Carbon's CREATE page helps user to provide the minimum required properties to successfully create an object. The rest of properties are pre-set with default values if necessary.

All other properties are initially hidden in 'Advanced' expandable section and the section is collapsed by default. To configure more, user can simply expand 'Advanced' section and change values.

Carbon provides the nearly 1-1 mapping with T-SQL syntax so that user can script a complete T-SQL CREATE statement using Carbon's CREATE page.

> Obsolete / legacy properties will be filtered out from the first release of Carbon. Those porperties will be added based on customer's feedback.

## CREATE DATABASE

### Required properties

* Database name

### Advanced properties

> Proposal: do not provide priority 4 items in Carbon

> (todo) Further clean-up unncessary properties during 'CREATE'.

> (ux design) Layout of filegroup / file list and file browser interface.

|Category|Property name|Interaction type|Default value|Default State|Priority|
|:---|:---|:---|:---|:---|:---:|
|Generic|collation|dropdown|<default>||0|
||compatibility level|dropdown|compat enum||0|
||containment type|dropdown|**none**/partial||1|
|Recovery|Recovery model|dropdown|**full** / simple / bulk-logged||0|
||Page Verify|dropdown|CHECKSUM|||
||Target Recovery Time(Seconds)|inputbox|60|||
|Filegroups|Rows/Filestream/Memory Optimized Data|||||
|Files|Database files|table with add/remove action||||
|DB Scoped Configuration|Legacy cardinality Estimation|On/Off|Off|||
||Legacy cardinality estimation for secondary|dropdown|Primary|||
||Max DOP|inputbox|0|||
||Max DOP for Secondary|inputbox||||
||Parameter sniffing|on/off|On|||
||Parameter sniffing for secondary|dropdown|Primary|||
||Query Optimizer Fixes|on/off|off|||
||Query Optimizer Fixes for Secondary|dropdown|Primary|||
|FTS|Use full-text indexing|checkbox|true|disabled if fulltext is not enabled on the server||
|FILESTREAM|FILESTREAM Directory Name|Filebrowser||||
||FILESTREAM Non-Transacted Access|on/off|Off|||
|Service Broker|Broker Enabled|true/false|false|||
||Honor Broker Priority|true/false|false|disabled|4|
||Service Brokcer Identifier|label|guidvalue|disabled|4|
|State|Database Read-Only|true/false|false|||
||Database State|label|Normal|disabled|4|
||Encryption Enabled|true/false|false|||
||Restrict Access|dropdown|MULTI_USER|||
|Miscellaneous|Allow Snapshot Isolation||false|||
||ANSI NULL Default||false|||
||ANSI NULLS Enabled||false|||
||Ansi Padding Enabled||false|||
||ANSI Warnings Enabled||false|||
||Arithmetic Abort Enable||false|||
||Concatenate Null Yields Null||false|||
||Cross-database Ownership Chaining Enabled||false|disabled|4|
||Date Correlation Otimization Enabled||false|||
||Delayed Durability||disabled|||
||Is Read Committed Snapshot On||false|||
||Numeric Round-Abort||false|||
||Parameterization||Simple|||
||Quoted Identifier Enabled||false|||
||Recursive Triggers Enabled||false|||
||Trustworthy||false|disabled|4|
||VarDecimal Storage Format Enabled||true|disabled|4|
|Automatic|Auto Close||false|||
||Auto Create Incremental Statistics||false|||
||Auto Create Statistics||true|||
||Auto Shrink||false|||
||Auto Update Statistics||true|||
||Auto Update Statistics Asynchronously||false|||
|Containment|Default Fulltext Language LCID||1033|Enabled only when DB Containment type is set to partial||
||Default Language||English|||
||Nested Triggers Enabled||true|||
||Transform Noise Words||false|||
||Two Digit Year Cutoff||2049|||
|Cursor|Close Cursor on Commit Enabled||false|||
||Default Cursor||GLOBAL|||



## CREATE Login

## CREATE user

# Backlogs

> List all objects types that supports