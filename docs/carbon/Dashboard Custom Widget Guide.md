# Customizing the Management Dashboard
In this build of Carbon we released a customizable dashboard. In this guide you will learn how to create your first dashboard insight widget to monitor disk space.

## Open the Management Dashboard
To get to the dasboard double click on a database connection in the left pane and you will see the dashboard. Alternatively, you can right click and select "Manage" to view the dashboard. The default dashboard looks like this:
![](../images/dashboard_manage.jpg)

## Open the Settings File
-	Open Carbon and go to File --> Preferences --> Settings which will open up the settings.json file in two panes:
 ![](../images/insights_1.jpg)
-	Scroll down to the part of the file titled “Database  Dashboard Page (1)”
 ![](../images/insights_2.jpg)
-	Click in the left side of the file and select “Replace in Settings”
 ![](../images/insights_3.jpg)

 ## Customize the Settings File
-	Now in the settings.json file in the right you can edit the “insights-widget.” Here is the code snippet to replace the database insights-widget with:

		"selector": "insights-widget",
            "gridItemConfig": {},
            "config": {
                "type": "chart",
                "query": "SELECT [FREE SPACE] = convert(decimal(12,2), (convert(decimal(12,2),round((a.size-fileproperty(a.name,'SpaceUsed'))/128.000,2)) / convert(decimal(12,2),round(a.size/128.000,2)) * 100)), [USED SPACE] = 100 - convert(decimal(12,2), (convert(decimal(12,2),round((a.size-fileproperty(a.name,'SpaceUsed'))/128.000,2)) / convert(decimal(12,2),round(a.size/128.000,2)) * 100)) FROM dbo.sysfiles a ORDER BY [Name];",
                "colorMap": {
                    "FREE SPACE": "green",
                    "USED SPACE": "red"
                }

## Additional Database Widget Customizations
Here are some additional editing options:
	- Type – count or chart. Start by changing “count” to “chart” and go to a server management dashboard to view the change. Your numbers will now appear as a pie chart.
	- Query – add any T-SQL query of your choice. Pictured above, I have one for disk space. Be sure to create variables for what you would like to appear on the dashboard ([FREE_SPACE_%] is mine above)
	- colorMap – select the colors that you would like for your chart. Use the variable names from your query as labels (it must match the query variable exactly). Some colors you can choose from are red, blue, green, black and white.
-	Go to your management dashboard and view the widget you just created by clicking on a server!
 ![](../images/insights_4.jpg)
-	Go forth and create your own widgets! Let us know what widgets you decide to create – email taraj@microsoft.com and share your query and creations to help us build out the insights portion of the dashboard!

## More Dashboard Customization Options
- [Dashboard Components Overview](dashboard - dashboard components.md)
- [Server Dashboard Insights](dashboard - custom server widget.md)
- [Task Widget](dashboard - custom task widget.md)
- [Explorer Widget](dashboard - custom explorer widget.md)
