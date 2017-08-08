# Execution Plan
This document describes execution plan viewer scenarios and feature for the first public preview.

## Target user
The first release of execution plan viewer in Carbon targets application developers who has a basic or intermediate knowledge of SQL Server query plan and how to read the showplan to tune up queries for their application use. It is non-goal to support very complex queries yet in the first release. 

## Key Customer Asks

### Meeting notes with Adam Machanic [techEd session by Adam](https://www.youtube.com/watch?v=GSZPvF2u6WY)

* Showplan representation - graphical tree view is a must.
* Fine tune the data format in node details popup - easier to read with the value and unit instead of just showing numbers e.g. CPU, IO metrics
    * Unit in second based on a referece computing power (estimated)
    * Unit in second based on actual execution (actual)
    * Adam suggests do not reference estimate cost.
* Navigation control side by side with graphical showplan
    * List of nodes that user can search / sort and click to navigate to a node in the graphical showplan
        * Sort by CPU, IO metric
        * Search / sort by name of node
        * Search / sort by node type
        * List of potential issue nodes based on Adam's tip & tricks
            * Lookup
            * Spool
            * Sort
            * Hash
            * serial Nested Loop
            * thick pipe

            * message 'focus on thick line and 5 operator types first'

* Bug fix
    * Calculation of total rows with nested loop node. Estimated plan shows incorrect value in the current version in SSMS.

## SAMP execution plan customer feedback

* SAMP execution plan is much more productive than SSMS execution plan
* What customers liked
    * zoom in and out smoothly and swithc the view between node and icon views.
    * collapsible subtree for a medium to large plan where the most help is needed.
    * highlight node with the cost by total, cpu and io percentage.
    * highlight nodes by an operator type. It is wonderful to quickly identify potential issues.
    * grid view with sort by column. great for shoplan_text lovers

* What customers suggested not to do
    *  do not make 'open operator tooltip' with a click-to-open. Open the tooltip with a mouse-hover.
    *  do not hide important operator properties in 'view more' page in the tooltip. Show the properties on the first page of the node tooltip.

## I CAN scenarios

* I CAN view estimated & actual execution plan.
* I CAN view execution plan in tree view.
    * I CAN view the operation information on each node
        * physical and logical operator information
        * cost of operation
        * row number
    * I CAN view details of operation in a tooltip with mouse-hover
    * I CAN view suggestions from showplan e.g. missing index.
    * I CAN highlight nodes with a selected operation type.

* I CAN view exeution plan in grid view.
    * I CAN sort each column.

* I CAN open a *.showplan file into execution plan viewer.

* I CAN open showplan xml query reult from Carbon's result view into execution plan viewer.

## UI basic functionality

### Graphic View

* Show Operator node
    * operator name
    * operator icon
    * Show estimated cost (%) and estimated / actual number of rows : by Adam Machanic estimated values are not useful in realworld practice - validate it.
        * Show by Total (default)
        * Show by CPU % (adv)
        * Show by IO % (adv)
    * number of rows

* Zoom in and Zoom out plan view
    * Zoom out to simplify the view.
    * Zoom in to show more properties

* Scroll up-down and right-left

* Tooltip for details

* Highlight operators
    * scan
    * seek
    * merge join
    * hash match
    * nested loop
    * sort
    * reference to all [operators](https://technet.microsoft.com/en-us/library/ms191158(v=sql.105).aspx)

### Grid View

* Sort by column: ASC, DESC
* Show and Hide column (?)
* Grid view columns
    * Node ID
    * Logical Operation
    * Physical Operation
    * Estimated CPU % / cost
    * Estimated IO % / cost
    * Average Row Size in bytes
    * Estimated Rows
    * Actual Rows
    * Estimated Rebinds
    * Estimated Rewinds

## Tooltip (Properties)


## Reference

[SAMP execution plan session 1 41:11 mark](https://www.youtube.com/watch?v=VMiNeQaszbg&list=PLL1Xq7MmIx0jvQ3RopmcOyPRdQHzstz6R)

[SAMP execution plan session 2](https://www.youtube.com/watch?v=t2n_vnZTcA0)

[Operators](https://technet.microsoft.com/en-us/library/ms191158(v=sql.105).aspx)