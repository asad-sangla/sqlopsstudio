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

## Design meeting note with Pedro Lopes

Raw Notes

Eric: we want to focus on 80% of devs, not 20% with complex plans
Pedro feedback:
Skeptical that most devs will want to enter this space
It's an advanced scenario
Most devs : want to know it works
Common persona: Developer DBA / DBA
Dev DBA: assist dev team, specialize in this area
Eric: correction based on the feedback. It would be the 20% of the 


DoA requirements
Why no icons? These are an easy way to identify things
All compile time warnings must be available
Loves Top Operations
Tooltip must stay on the screen (all must be visible, or be in a scrollbar)
Actual plans are absolute DoA requirement

North Star requirements
How to make it "easier" for users?
If I have a warning, e.g. convert implicit of something that may affect seek plan.
Already have reference of which column & table that conversion is happening.
If looking to simplify, make it evident
Where it occurs
Which Select it happens on
So if I have a warning, make it very obvious where this is happening in the query & hence how to fix?
Missing index will refer to which table, with which columns is an index being recommended
Can map to where this is coming from: Table, Column names, can figure out how to match them up
Inside the "select" node, have little yellow warnings indicating issues in the select

Side notes:
Are percentages useful? Not really. These aren't used internally
Thickness of arrow helps indicate that this may be a "hot spot"

How do dev DBAs ramp up?
Do specific, paid courses
Go on YouTube and learn

How do you find problems?
Look for spools. These highlight inefficiencies that the engine is compensating for
Look for thickness of lines as they're hot spots
Look for warnings

How does user apply fixes based on plan?
Example: ensure that data type conversion is minimized, in order to avoid compiler warnings about this in the results
Questions: should we help alter the code? E.g. generate changes to the stored procedure to fix this?
Are there a small common set that could help fix this?
For the most part, yes. You need the metadata from SMO or DacFx to handle this

What would you do differently to get from "there's an issue" to "we have fixed the issue with this plan"?
Plan scenario is something we've done in this area. It helps us understand there's an index spool in the plan, this maps to lack of a proper index, suggest creating a new index
I have a TVF somewhere in my code, that, we guesstimate in this scenario. Suggest changing to temporary tables
This is all primarily on the actual plan.
"C differences" in plans, e.g. cardinality estimation difference.

Would having a lighter version of a query plan help?
E.g. just show top issues like missing index?
Pedro: sees people just creating the same index due to warnings, which starts to hurt things.
If you can implement something around missing indexes where you analyze existing indexes & see if you can fix an existing index, do so. E.g. if you added a new column that should be in an existing index, let that be the change. Otherwise it's inefficient
Must be aware that you need to balance out the # indexes in the table
Often more nuanced than "add another index"

What's the state of Database Tuning Advisor - do people use it? Does it help?
It helps a little.
In Azure, the auto tuning creates missing indexes. It analyzes if it was useful & rolls back. They're scratching this and replacing with the tuning advisor logic as it's more precise
Plan to extend DTA to Calcium.
Scenarios DTA covers: Missing indexes, missing statistics, horizontal partitioning, indexed views
Looks at physical design structures
Doesn't take on "your query is poorly written, you need to rewrite"
Implementing a spin-off of DTA that can analyze a workload. Intend to do tuning based on things we can't handle, and add some knobs to tweak that
E.g. joins with cardinality estimates way off what was expected. Know how this pattern can be leveraged
Add plan guides to hint to the optimizer how to tweak the query and do things a little better
Adds in some level of query tuning into DTA
Very useful for upgrade / post migration movements

Top Operations feedback
Would like to click on element in Top Operations and go to the relevant part of the query plan
Filtering? Not that important. Useful but not vital
What are the most important operators.
All are important. Want to look at all, do not hide them


Are there a set of heuristics that we can write (extensible) that can be leveraged to do warnings?
E.g. combine a set of "partitioned true plus high cost" to generate ad-hoc warnings? Extend the data?
With actual plans, just by leveraging warnings we're adding to showplan, you get a lot you can use
If using TVF, and ratio between estimation & actual number, will get a warning
All the spills cause warnings. All are actionable
E.g. doing a sort, doesn't fit into memory, have engine do "fix" that can be inefficient
If did severe misestimation & can't fit a sort / hashmatch in memory, that'll spill to tempdb and have a warning
Up to 2012, had same warnings since 2000
Post-2012, added 7-8 new warnings
In 2016 added more, 2017 will have more
Are available warnings documented anywhere? Yes: documented in books online. It's in the XSD. Describes what each warning is
Just leveraging the engine intelligence can make life much easier
Again, would be good to map the warning to the operator that's relevant to it

For large plans, should we show an easy way to drill into the plan and peek at plan near certain operators that are problematic? Would that be better than the large plan?
Pedro: as you go up the tree, start to detect problems "high up" in the tree. Need to chase down where the cardinality estimation differences are happening down the tree
If have some inefficiency in some hashmap, would be looking at a huge difference in estimations & actuals. Need to chase down the tree. Will find where the difference is & find the solution
Cardinality issues are there in the "analyze plan" feature added to SSMS
Right-click on plan, choose "analyze", then get the summary of areas that are problematic
Ordered by how far off the estimate was (% difference between estimated and actual)
Adds contextual information on reasons this might be happening
The logic for what issues are there, and how to solve, is all in SSMS
Can we do this for other databases?
Broadly, yes. C-estimate issues are common.
May need to do mappings to the specific concepts in that DB type

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
