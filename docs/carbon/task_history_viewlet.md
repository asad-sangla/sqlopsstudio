# Overview

This document describes the key functional scenario of Task viewlet. The goal of task viewlet is to provide one stop experience for the following functionality:

- View the history of successful, failed or in-progress tasks. (6/30)
- View the detail of successful, failed or in-progress task. (6/30)
- Re-run a task with the same or modified configuration.
- Save the task execution history as a manage workflow creation or documentation.

## Task Execution History and Detail

- On actionbar
	- Badge icon that indicates the number of new successful / failed / in-progress task history entry. (6/30 - stage 2) 
		- Start with + icon rather than the number and clear it off when viewlet opens up. (6/30 - stage 1)
		- Indicate with blue circle badge (6/30 - stage 2)
		- Stage 1 - show the viewlet when task is committed.
	- Reset the number by viewing each entry or mark all as viewed in the viewlet.


- On viewlet
  - Success / Failure / In progress indicator icon
  - Task name, server, database
	- UX 
		- 1st line - Icon, Task name, Source (Server & Database)
		- On error - popup the error message.
			- On error - doublec click to open error message text file.
		- On Hover over, 
			- Success: Start and End Time, elapse time
			- Error: Start and End time, error message
			- In progress: Start time, elapse time
  
  --6/30 cut line--
  - Open Detail page
  - Clear history
  - Save history

- On detail
	
	- Show error message for failed task
	
	-- June 30 cut line ---

  	- Success / Failure / In progress indicator icon
  	- Task name, server, database
  	- Executed As, SPID
  	- Progress indicator for in progress task
  	- Start, End, Elapse Time
  	- Error message for failed task
  	- Open Task fly-out to re-run. Reconstruct the settings on the task fly-out.
    	- Success and Failed task only
  	- View the Task configuration summary (or T-SQL script)
  	- Save as a file.
  
  
  - Functional scenarios
  	- Task history shows all task execution entries from multiple carbon sessions on a specific client machine.
		- 6/30 show task histories of the current sessions only. e.g. close carbon and restart will reset the hisotry.
	- Task cancellation (6/30)
  		- Prompt whether to cancel tasks in-progress
			- On Windows shutdonw / restart
  
  
