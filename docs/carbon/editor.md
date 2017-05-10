# Connect, Edit and Query : Script Developer Experience
This speclet describes the developer functional requirements for 5/30 and 6/30 previews.

## Functional Readiness Check & Suggestions

> updated on 5/9

#### T-SQL Editor, Execution & Result


* I CAN open folder without restarting Carbon.
    * When I open a folder, Carbon should show the folder structure after folder is open.

* I CAN easily view the connected server and logged on user name.
    * display <connected servername> : <username> on the editor commmand bar. Right aligned.

* I CAN set open New query as the default behavior of making connection to a server / database using OE.

* I CAN toggle view / hide the result pane. (low priority)

UI

* Need to update icons for run query, cancel query, connect, disconnect, change connection icons

Reliablity

* Canceling query is not reliable. While canceling query, user can CMD+1 to clone the editor in different Split window and execute the query without explicitly making a connection.


#### Connection Dialog

* I CAN browse the registered connections in Connection dialog.
    * Flat list of registered connections.

* I CAN distinguish recent connections with Server, Database and User Name.
 
* I CAN make a connection to a specific database by selecting a database from 'Database Name' drop-down.

Defects

* Recent history does not reliably show the connection history when repeating connect, disconnect, change connection using editor command bar.

### Shortcuts 

* Connect: open the connection dialog


### Command Palette

* Add prefix **SQL**: to easily find SQL related commands.

* SQL: Connect
* SQL: Disconnect
* SQL: Change Connection
* SQL: Run Query (or Execute Query to be consistent with mssql extension)
* SQL: Cancel Query

* SQL: USE Database (open question: can we expand the database dropdown control using command palette?)


### Source Control

Defect

* Source Control (Git) is not sync with the currently open folder.

### Edit Data

* I CAN get better edit failure reason. Current message - 'Commit row failed - undefined'.

* I CAN see the insert / update / delete statement in OUTPUT windows. 

    * Ideally, I CAN record changes and generate insert / update / delete statement from data edit actions in the same edit data session.

UI

* update edit data command bar icons

* add border-padding on the grid control based on the Carbon style guide.
