# Project "CARBON" Private Preview: May 30, 2017

## Known Issues

Project "Carbon" embraces 'open source' nature and shares feature previews from its early shape. The source code will be published as a public open source project soon. Currently implemented "Carbon" features are roughly in two engineering states.

* **Punch-through**: Engineering focus is on **getting things up and running** in the service and API layers first. UX design is not implemented or in process at an early stage. Lots of rooms for bold changes through customer feedback and contributions.

* **Alpha / Beta**: Functional scenarios and UX designs are implemented. Fit & finish is in process. Features still require various refinements through customer feedback.

### List of features and states in 5/30 private preview

|State|Feature|Comment|
|:---|:---|:---|
|Punch-through|MANAGE page and its content|Including object properties, tasks and management insights|
||Search in MANAGE page||
||CREATE DATABASE dialog||
||Backup dialog||
||Shell menus||
||Error messages||
|Alpha / Beta|Connection dialog|Including add / remove connections to Servers viewlet|
||Server Groups||
||Object Explorer|Including its folder structure and supported object types and supported actions e.g. SCRIPT AS|
||Edit Data||
||T-SQL Editor||
||Query Result views||


### Known Design Issues

* MANAGE page layout: new design and implementation are in process.

* Dialog UI layout: Fly-out dialog based UI implementation is in process.

* UI styles for UI controls: Applying UI style gides to UI controls is in process.

* Error message dialog and error content design is in process.

* Remote File Explorer for remote file system access tasks including CREATE DATABASE and BACKUP.


### Known Functional Issues

* CREATE DATABASE may fail with an error indicating Carbon has failed to gain an exclusive lock: Workaround - restart carbon

* Expanding OE may fail or slow: Workaround - try **Refresh** context menu or restart Carbon.

* OE may not display all object types - Key object types such as Tables, Views, Functions and SPs are implemented and other types implementation is in process.

* SELECT TOP 1000 OE action on table may fail.

* SCRIPT CREATE OE action on a database object may fail.
