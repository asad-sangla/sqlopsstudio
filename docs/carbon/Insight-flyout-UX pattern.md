# UX Pattern for Insights Flyout

When a user clicks 'Show insight' on the insight widget, a flyout slides in on the right.

The top section shows a key value pair.

The key-value pair are represented in a grid with column name.
The rows will have the object, an icon that represents the object in different state and the status in text.

Each row will have a context menu which will list the actions that can be taken on that object.

Clicking on a particular action will open that task flyout.

The lower section shows rest of the details for that object.


<img src='../images/InsightsFlyout_1.png' width='400px' />


<img src='../images/InsightsFlyout_2.png' width='400px' />

By default the top section is about 2/3 size of the content area and the bottom section is about 1/3rd size of the content area.

By default when the flyout opens, the first object needs to be selected.


## ACCESSIBILITY:

Tab order : Name, Status, Details section and Context menu.
