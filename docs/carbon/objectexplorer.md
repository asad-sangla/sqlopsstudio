# Functional Spec: Object Explorer
This document lists functional feature sceanrios based on 5/3 carbon implementation targetting the first preview.

> milestones: m1 - private preview, m2 - public preview, ga - GA

## Definition

Carbon's OE provides a holistic view of **'what'**, resources in servers and databases, e.g. server and database and its contained objects as resources to manage.

Carbon's OE **DOES NOT** intend and / or allow to surface up 'how' to manage those resource as a part of OE structure. e.g. Replication, QDS views, Audits, PBM, Maintenance Plan, Logs etc. The functionalities of 'how' to manage is a functional domain of 'Manage' pages with corresponding insights and actions.

Context menu of OE should provide simple access points for the following only. We should keep it simple.

* Provisioning / scripting
* Start a new query
* View edit / data for table
* Key tasks for Recovery and HA operations only.
	* Note that OE context menu will not list HA configuration task which is a functional domain of Manage. Instead it will have a context menu for HA operation e.g. Failover.
* Manage - all other management tasks are performed within MANAGE page context with insights for corresponding object types, e.g. server, database, table etc.

## Terms

* Obejct Explorer - the name of viewlet
	* Group
		* Server profile

> proposal: change VS Code's 'Explorer' to 'File Explorer'

## OE Functional GAP analysis (5/3)

I CAN add a new group to OE.
* On OE, start **add group** action.


* Using add group dialog, configure the group settings.
	- Name
	- Group Color
	- Description

* Click Add button to add a new group on OE.

> proposal: Editor's command bar background color matches to the group color.


I CAN add a new server profile under an existing group.
* Select an existing group in OE.
* Start add new server profile action.
* Using add new server profile dialog, configure the profile settings.
* Click Add button to add the profile to the selected group on OE.

I CAN search server profiles.
* The result is shown as a flat server profile list.

> implemented

I CAN filter OE with server profiles with active connections or search results only.
* The result is shown as a flat server profile list.

> implemented

> remove recent connection filter from OE.

I CAN connect and expand server and database node from the search / active connections list.

> implemented

I CAN easily know the database state and user_access state from OE.

* OE fail quickly when user tries to expan a database with inaccessible state. Follow SSMSS model

* Show corresponding database state icon

* Show corresponding database state label

	* check state_desc and user_access_desc fields in sys.databases table.

|State|Type|Icon|Label|accessible|note|
|---|---|---|---|---|---|
|MULTI_USER|user_access|normal DB icon|none|Yes||
|SINGLE_USER|user_access|single user db icon|(Single User)|Yes||
|RESTRICTED_USER|user_access|restricted user db icon|(Restricted User)|Yes||
|ONLINE|state|normal DB icon|none|Yes||
|RESTORING|state|RESTORING DB icon|(Restoring)|No||
|RECOVERING|state|normal|(RECOVERING)|No||
|RECOVERY_PENDING|state|normal|(Recovery Pending)|No||
|SUSPECT|state||||
|EMERGENCY|state||||
|OFFLINE|state|offline db icon|(Offline)|No||

> check Azure SQLDB's COPYING and OFFLINE_SECONDARY states

I CAN easily find out server connection vs database connection on OE using the icon.

I CAN easily distinguish the server profile by viewing the following information on OE.
* Server profile name
* Server name
* Database name
* User name

### Context Menu

* On OE
	* New group
	* New server profile

* On Group
	* new server profile
	* Rename
	* Remove

* On Server profile
	* Connect / Disconnect
	* New query
	* New database
	* Restore database
	* Manage
	* Rename
		* Changes the profile name
	* Remove
	* Refresh

* On Database
	* New query
	* Backup database
	* Restore database
	* Script As: CREATE
	* Manage
	* Delete
		* (todo) design drop database dialog
	* Refresh

* On Table
	* New query
	* Select top 1000 rows
	* Edit data
	* Script AS: CREATE
	* Manage
	* Delete
		* (todo) design drop ```object``` dialog
	* Refresh

* On View
	* New query
	* Select top 1000 rows
	* Script AS: CREATE
	* Manage
	* Delete
		* (todo) design drop ```object``` dialog
	* Refresh

* On SP / Function
	* Script AS: CREATE
	* Manage
	* Delete
		* (todo) design drop ```object``` dialog
	* Refresh

* On Folder for each object type
	* New ```Object Type```
		> Open editor with new ```object type``` snippet if the object type does not have its own MANAGE or CREATE page.


### OE Folder structure suggestions

- Remove **FileTables** and **External Tables** folders and merge it with **Tables**. Indicate different tables types with table icon.

> implemented

- Remove Service Broker node (?)

### OE Node properties

Table::Columns - Same functional parity as SSMS and SSDT. Display following:
- PK, FK indicator including the column icon
- data type
- null / not null

> implemented

Table::Index - Same functional parity as SSMS and SSDT. Display following:
- Index type

> implemented

Function / SP::Parameters - Same functional parity as SSMS and SSDT. Display following

- parameter type
- in / out / inout type
- default value

> implemented

### Deprecated features

Suggestion: remove following object folder types from OE.

- Programmability::Rules - deprecated and removed.
- Programmability:: Defaults - deprecated and removed.

> implemented

## Permission handling - LPU scenarios

I CAN get an explicit and easy to understand error messages:
- User does not have a permission to CONNECT database
- User does not have a permission to View Definition of database /schema / individual object

## Database state handling

- Fail-early for expanding OE node on non-accessible databases due to its state.

- Pop-up error message indicating that the database is not accessible since it's not online. refer to the database state table above.

