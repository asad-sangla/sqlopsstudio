# Custommizing the Management Dashboard
In this build of Carbon we released a customizable dashboard. The dashboard includes properties, tasks, explorer, and insights. Our first set of tasks include creating a backup and opening a new query. And the first insight is database health. Wish you could have more insights? Want to customize your dashboard? Well you’re in luck because the dashboard is fully customizable, meaning you can change the dashboard layout and create your own insights! We’re excited to share this with everyone as it’s super simple and we can’t wait to see the customizations and insights you add to Carbon. All it takes is a T-SQL query and a simple edit to the settings.json file. Below are some steps on how to customize the dashboard. If there is something you don't see that you would like to, submit an issue on the repo or email taraj@microsoft.com


- [Get Started](#get-started-with-dashboard-components)
- [Server Dashboard Insights](#server-dashboard-insights)
- [Database Dashboard Insights](#database-dashboard-insights)
- [Task Widget](#tasks-widget)
- [Explorer Widget](#explorer-widget)

## Get Started with Dashboard Components
The Carbon Management Dasboard has a few different parts to it. To get to the dasboard double click on a server's name and you will see the dashboard. Alternatively, you can right click and select "Manage" to view the dashboard. The default dashboard looks like this:

![](../images/dashboard_manage.jpg)

In this guide, we will walk you through how to customize various parts of the dashboard, starting with adding insights and followed by general visual customizations.

## Server Dashboard Insights
-	Open Carbon and go to File --> Preferences --> Settings which will open up the settings.json file in two panes:
 ![](../images/insights_1.jpg)
-	Scroll down to the part of the file titled “Server Dashboard Page (1)”
 ![](../images/insights_2.jpg)
-	Click in the left side of the file and select “Replace in Settings”
 ![](../images/insights_3.jpg)
-	Now in the settings.json file in the right you can edit the “insights-widget.” Here are some editing options:
	- Type – count or chart. Start by changing “count” to “chart” and go to a server management dashboard to view the change. Your numbers will now appear as a pie chart.
	- Query – add any T-SQL query of your choice. Pictured above, I have one for disk space. Be sure to create variables for what you would like to appear on the dashboard ([FREE_SPACE_%] is mine above)
	- colorMap – select the colors that you would like for your chart. Use the variable names from your query as labels (it must match the query variable exactly). Some colors you can choose from are red, blue, green, black and white.
-	Go to your management dashboard and view the widget you just created by clicking on a server!
 ![](../images/insights_4.jpg)
-	Go forth and create your own widgets! Let us know what widgets you decide to create – email taraj@microsoft.com and share your query and creations to help us build out the insights portion of the dashboard!

## Database Dashboard Insights
Creating a database dashboard insight is very similar to a server dashboard insight.
-	Open Carbon and go to File --> Preferences --> Settings which will open up the settings.json file in two panes:
 ![](../images/insights_1.jpg)
-	Scroll down to the part of the file titled “Database  Dashboard Page (1)”
 ![](../images/insights_2.jpg)
-	Click in the left side of the file and select “Replace in Settings”
 ![](../images/insights_3.jpg)
-	Now in the settings.json file in the right you can edit the “insights-widget.” Here are some editing options:
	- Type – count or chart. Start by changing “count” to “chart” and go to a server management dashboard to view the change. Your numbers will now appear as a pie chart.
	- Query – add any T-SQL query of your choice. Pictured above, I have one for disk space. Be sure to create variables for what you would like to appear on the dashboard ([FREE_SPACE_%] is mine above)
	- colorMap – select the colors that you would like for your chart. Use the variable names from your query as labels (it must match the query variable exactly). Some colors you can choose from are red, blue, green, black and white.
-	Go to your management dashboard and view the widget you just created by clicking on a server!
 ![](../images/insights_4.jpg)
-	Go forth and create your own widgets! Let us know what widgets you decide to create – email taraj@microsoft.com and share your query and creations to help us build out the insights portion of the dashboard!

## General Dashboard Widget Customizations
### Tasks Widget
-	Open Carbon and go to File --> Preferences --> Settings which will open up the settings.json file in two panes:
 ![](../images/insights_1.jpg)
-	Scroll down to the part of the file titled “Database  Dashboard Page (1)” or "Server Dashboard Page (1)" depending on which task widget you'd like to customize
 ![](../images/insights_2.jpg)
-	Click in the left side of the file and select “Replace in Settings”
 ![](../images/insights_3.jpg)
-	Now in the settings.json file in the right you can edit the “tasks-widget.” Here are some editing options:
	- sizex - this customizes the width of the widget
	- sizey - this customizes the height of the widget

### Explorer Widget
-	Open Carbon and go to File --> Preferences --> Settings which will open up the settings.json file in two panes:
 ![](../images/insights_1.jpg)
-	Scroll down to the part of the file titled “Database  Dashboard Page (1)” or "Server Dashboard Page (1)" depending on which task widget you'd like to customize
 ![](../images/insights_2.jpg)
-	Click in the left side of the file and select “Replace in Settings”
 ![](../images/insights_3.jpg)
-	Now in the settings.json file in the right you can edit the “explorer-widget.” Here are some editing options:
	- sizex - this customizes the width of the widget
	- sizey - this customizes the height of the widget