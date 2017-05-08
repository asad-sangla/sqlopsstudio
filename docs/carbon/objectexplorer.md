# Functional Spec: Object Explorer
This document lists a function feature sceanrio based on 5/3 carbon implementation targetting the first preview.


## OE Functional GAP analysis (5/3)

I CAN add a new group to OE.
* On OE, start **add new group** action.
* Using add group dialog, configure the group settings.
	- Group Name
	- Group Color
	- Group Description
* Click Add button to add a new group on OE.

I CAN add a new server profile under an existing group.
* Select an existing group in OE.
* Start add new server profile action.
* Using add new server profile dialog, configure the profile settings.
* Click Add button to add the profile to the selected group on OE.

I CAN search server profiles.
* The result is shown as a flat server profile list.

I CAN filter OE with server profiles with active connections only.
* The result is shown as a flat server profile list.

I CAN connect and expand server and database node from the search / active connections list.

I CAN easily find out server connection vs database connection on OE using the icon.

I CAN easily distinguish the server profile by viewing the following information on OE.
* Server Profile nickname
* Server name
* Database name
* User name

### Context Menu

* On Group
	* Add new server
	* Rename
	* Remove

* On Server
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
	* Script
	* Manage
	* Delete database
		* (todo) design drop database dialog

	* Refresh

* On Table
	* New query
	* Select top 1000 rows
	* Edit data
	* Script
	* Manage
	* Rename
	* Delete table
		* (todo) design drop ```object``` dialog
	* Refresh

* On Folder for each object type
	* New ```Object Type```
		> Open editor with new ```object type``` snippet

### OE Folder structure suggestions

- Remove **FileTables** and **External Tables** folders and merge it with **Tables**. Indicate different tables types with table icon.

Consider adding following structures:

- Server Objects
	- Backup Devices

- Replication (post preview)


### OE Node properties

Table::Columns - Same functional parity as SSMS and SSDT. Display following:
- PK, FK indicator including the column icon
- data type
- null / not null

Table::Index - Same functional parity as SSMS and SSDT. Display following:
- Index type

Function / SP::Parameters - Same functional parity as SSMS and SSDT. Display following

- parameter type
- in / out / inout type
- default value


### Deprecated features

Suggestion: remove following object folder types from OE.

- Programmability::Rules - deprecated and removed.
- Programmability:: Defaults - deprecated and removed.

## Permission handling - LPU scenarios

I CAN get an explicit and easy to understand error messages:
- User does not have a permission to CONNECT database
- User does not have a permission to View Definition of database /schema / individual object

