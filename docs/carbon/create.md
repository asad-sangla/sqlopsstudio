# Create Page: Database and DB Object Provisioning
This speclet describes CREATE functionality in Carbon. The goal is to allow users to:

* Quickly create database and db objects with a minimum effort with smart defaults.
* Or configure more properites to maximize the full functional potential of db / db objects in SQL server.

* All CREATE actions are scriptable to run programmatically and / or to automate.

## Functional Pattern

Carbon's CREATE page helps user to provide the minimum required properties to successfully create an object. The rest of properties are pre-set with smart default values if necessary.

All other properties are initially hidden in 'Advanced' expandable section and the section is collapsed by default. To configure more, user can simply expand 'Advanced' section and change values.

Carbon provides nearly 1-1 mapping with T-SQL syntax so that user can script a complete T-SQL CREATE statement using Carbon's CREATE page.

> Obsolete / legacy properties will be filtered out from the first release of Carbon. Those porperties will be added based on customer's feedback.

## CREATE DATABASE

### Required (basic) properties

* Database name

### Advanced properties

> Proposal: do not provide priority 4 items in Carbon

> (todo) Further clean-up unncessary properties during 'CREATE'.

> (ux design) Layout of filegroup / file list and file browser interface.

> (todo) Azure SQLDB experience

|Category|Property name|Interaction type|Default value|Default State|Priority|
|:---|:---|:---|:---|:---|:---:|
|General|Collation|dropdown|server default||0|
|Recovery|Recovery Model|dropdown|**full** / simple / bulk-logged||0|
|Filegroups|Rows/Filestream/Memory Optimized Data|||||
|Files|Database files|table with add/remove action||||

### More properties

In Carbon, we propose not to surface up following options from CREATE page.

1. Not all is a part of the CREATE DB experience.
2. Most of these options are better suited in EDIT Database experience.

Properties that are part of CREATE t-sql statement

|Category|Property name|Interaction type|Default value|Default State|Priority|
|:---|:---|:---|:---|:---|:---:|
|Containment|Containment Type|dropdown|**none**/partial||1|
||Default Fulltext Language LCID||1033|Enabled only when DB Containment type is set to partial||
||Default Language||English|||
||Nested Triggers Enabled||true|||
||Transform Noise Words||false|||
||Two Digit Year Cutoff||2049|||
||Service Broker|Broker Enabled|false||||
||DB Chaining Enabled||true||||

Properties that can be updated with ALTER t-sql statement.

|Category|Property name|Interaction type|Default value|Default State|Priority|
|:---|:---|:---|:---|:---|:---:|
||Compatibility Level|dropdown|compat enum||0|
|Automatic|Auto Close||false|||
||Auto Create Incremental Statistics||false|||
||Auto Create Statistics||true|||
||Auto Shrink||false|||
||Auto Update Statistics||true|||
||Auto Update Statistics Asynchronously||false|||
|Cursor|Close Cursor on Commit Enabled||false|||
||Default Cursor||GLOBAL|||
|Recovery|Page Verify|dropdown|CHECKSUM|||
||Target Recovery Time(Seconds)|inputbox|60|||
|FTS|Use full-text indexing|checkbox|true|disabled||
||Honor Broker Priority|true/false|false|disabled|4|
||Service Brokcer Identifier|label|guidvalue|disabled|4|
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
|State|Database Read-Only|true/false|false|||
||Database State|label|Normal|disabled|4|
||Encryption Enabled|true/false|false|||
||Restrict Access|dropdown|MULTI_USER|||
|FILESTREAM|FILESTREAM Directory Name|Filebrowser||||
||FILESTREAM Non-Transacted Access|on/off|Off|||
|DB Scoped Configuration|Legacy cardinality Estimation|On/Off|Off|||
||Legacy cardinality estimation for secondary|dropdown|Primary|||
||Max DOP|inputbox|0|||
||Max DOP for Secondary|inputbox||||
||Parameter sniffing|on/off|On|||
||Parameter sniffing for secondary|dropdown|Primary|||
||Query Optimizer Fixes|on/off|off|||
||Query Optimizer Fixes for Secondary|dropdown|Primary|||

## CREATE Login

## CREATE user

# Backlogs

> List all objects types that supports