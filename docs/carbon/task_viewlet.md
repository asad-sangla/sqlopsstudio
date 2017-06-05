# Overview

This document describes the key functional scenario of Task viewlet. The goal of task viewlet is to provide one stop experience for the following functionality:

- View the history of successful, failed or in-progress tasks.
- View the detail of successful, failed or in-progress task.
- Re-run a task with the same or modified configuration.
- Save the task execution history as a manage workflow creation or documentation.

## Task Execution History and Detail

- On actionbar
	- Badge icon that indicates the number of new successful / failed / in-progress task history entry.
	- Reset the number by viewing each entry or mark all as viewed in the viewlet.

- On viewlet
  - Success / Failure / In progress indicator icon
  - Task name, server, database
  - Open Detail page
  - Clear history
  - Save history
  
- On detail page
  - Success / Failure / In progress indicator icon
  - Task name, server, database
  - Progress indicator for in progress task
  - Start, End, Ellapse Time
  - Error message for failed task
  - Open Task fly-out to re-run. Reconstruct the settings on the task fly-out.
    - Success and Failed task only
  - View the Task configuration summary (or T-SQL script)
  - Save as a file.
  
