# Connect, Edit and Query : Script Developer Experience
This speclet describes the developer functional requirements for 5/30 and 6/30 previews.

## Discussion: Customer requirements

* I CAN view query execution result in horizontal split because I use wide monitor for my dev works.

> related item: I CAN see results and messages in tabs rather than one-document layout.

* I CAN use carbon editor as a scratchpad
    * No pop-up for unsaved files when closing Carbon.
    * Change editor tab name without saving the file.

    > vscode hot-exit can provide similar functionality (6/30). what happen when people change workspace what will happen?

* I CAN view editor sessions in a group / connected server perspective.
    * Group / filter editor tabs by connection
    * Show different colors per group / server.

    > good value. Lots of shell works + big modification of VS code. GA+ based on post feedback. need a spec and design in full spectrum.

* I CAN access recent connection history directly from editor command bar using a short cut without poping up Connection dialog.

* I CAN see the edtior connection, query execution status within editor session. 

    * Suggestion 1 - show the status in the editor command bar
    * Suggestion 2 - add editor status bar below Results / message pane.

* I CAN see results and message together.

    * Result Grid 1
    * Message 1
    * Result Grid 2
    * Message 2 

    > Line matching would be more useful than this? gather more customer feedback.

* I CAN see the result in graph and chart format in addition to the grid view.

> leverage existing ones.

## Discussion: Functional requirement

* I CAN browse the registered connections in Connection dialog to make a connection.

    > leverage ssdt connection dialog and its search experience

    > we should add browse local instances including docker containers


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


> agreed to have cp.

### Source Control

Defect

* Source Control (Git) is not sync with the currently open folder.

### Edit Data

* I CAN get better edit failure reason. Current message - 'Commit row failed - undefined'.

* I CAN see the insert / update / delete statement in OUTPUT windows. 

    * Ideally, I CAN record changes and generate insert / update / delete statement from data edit actions in the same edit data session.

    > generate upsert from **select** result grid.

UI

* update edit data command bar icons

* add border-padding on the grid control based on the Carbon style guide.
