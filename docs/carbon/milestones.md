# Milestone Roadmpa


## Milestones
    - M1: Private preview May 30 (June 2)
    - M2: Public previewJune 30


## June 30 Public Preview Readiness (M2)

- Partnerships – in progress
 
- Present “Carbon” to RohanK directs and other teams within DS.

- Present “Carbon” to Sean Mcbreen & co. next week.
  

- Documentation on docs.microsoft.com
	- Installation
    - Getting Started
	- Port and revise private preview guides into docs.microsoft.com
 
- High fidelity mockup with a core e2e scenario (Eric & Smitha) in progress
    - e2e scenario (north-star)
	- Backup Plan Builder (Recovery Plan Builder) (in progress)
	- Automation of agent job provisioning (in progress)
	- Agent job monitor (in progress)
	- Manage dashboard layout and sample insight (in progress)
	- Restore Plan Builder (in progress)
	
- Branding to go public (in progress)
    - Get the branding naming request template from Sanjay
    - Initiate it with naming council
    - Present to marketing taem (Joanne and Mitra)
 
 - OSS (in progress)
    - start OSS process w/o the official name (3 weeks). Update the project / product name after the branding name is finalized. (complete)
	- Discuss Cabon specific cases with CELA (June 06)
	- Github project preparation
		- README.md
		- Release.md
		- Wiki
			- Contribution
			- Customizations Wiki (refer to mssql extension wiki)
			- Pre-reqs and troubleshooting
			- How to report issues
 
- .NET 2.0 core + Windows Auth
    > Follow up on Kerberos setup experience on macOS and Linux
                > Who will build a simple CLI / Bash script experience to set it up.
 
- Acquisition (Tara)
    - M2: Specify M2 version of acquistion experience.
    > PM: spec review, functional testing
 
- Version 0.1 experience
    - OE (register server & group and browse server & database)
        - M1: OE full scope
        - M1: OE search - search for server / database names only.
 
        > (todo) design for the full object SEARCH functionality
 
    - CREATE experience e.g CREATE database (Eric)
        - M1: create database punch through experience to show case the CREATE experience and collect user feedback.
 
    - MANAGE (dashboard) (Tara + Eric & Sanjay)
        - Properties (ALTER)
            - M1 - Full properties page without ALTER scripting and execution capability.
 
        - Insights
            - Recovery Insight, Disk Usage Insights etc.
                > (todo) find out insight candidates and functional design for each insight.
 
            - M1: MANAGE page UX layout
            - M1: Recovery insight with backup & restore task mapped to show case Manage with Insight concept.
 
        - Management Tasks (action)
            - M1: Backup page
 
        - Search
            - M1: punch through experience for user feedback.
                > todo design for the full search and manage functionality. e.g. search object at server level for all its databases and database objects.
 
    - DELETE (DROP DDL) (Eric)
            - M1: Not in scope
            - M2: Delete
                > design: **close all active connection** **show dependency**
 
    - SCRIPT AS: CREATE
 
        - M1: script as database, table, etc
 
                - mssql-scripter integration in Carbon (generate script)
                                        - mssql-scripter for database node.
               
    - SQL Editor
        - M1: Full scope
 
    - Data Edit (Eric & Kevin)
        - M1: early bits to collect user feedback.
 
    - Connection
        - SQL
            - M1: Full
        - PGSQL*
            - M1: ??
 
    - Recovery (Eric)
        - Backup
            - M1: early punch through
        - Restore
            - M1: not in scope
	- Files.hotExit (scratchpad)
 
- PG functionalities (Sanjay)
    - Basic connectivity
    - Editor
    - * (all of above?)
               
 
-------- June 30 mark --------
- HA
    - AG Operations - Manual Failover
    - AG Configuration
    > GA blocker
 
- Showplan (Eric + Tara)
    > GA blocker
 
 

3. Release collaterals
    _ Readme in git.com (Eric)
    - Getting started docs (Tara & Sanjay)
    - Release Note (Karl + Eric)
 

		
# Complete 

## Socialization: Executive Overview - complete

Sanjay to initiate Executive Overview and socialization with LTs.

- Socializing with LTs
    - Scottgu
    - Joseph
    - R.Kumar's directs
    - Partnership
        - Redgate
        - SQL Sentry
        - mladen prajck

## Linux Townhall prep 5/25
 - Dec (EOD): Sanjay

 - Not under NDA - no PG content

 - Take some screenshots just in case the demo-god does not help on the Carbon functionality itself.

 - 20 min slide
 - 10 min demo
    - SSMS:Sanjay
    - VSCode: Eric
    - mssql-scripter: Tara

## Carbon Webinar prep 5/30

- Yammer announcement (done)
    - Check if we can create a folder for Carbon to better discoverability: Tara

    - If creating a folder is not possible, use a prefix. e.g. Carbon_xxxxx_versionNo.tar.gz, ...zip

    - Under NDA - yes PG content can be included

- Dec: Sanjay will start it and Erir and Tara to contribute to fill in blanks: ETA Tue

- Prep and uploading for the private preview bits: Tara & Karl: ETA Tuesday morning

- Word Doc: ETA Tue morning
    - How to install: Tara
    - How to use: Eric

- What do we announce?

- What we want to hear from?
    - MANAGE with Insight: e.g. Audit
    - OE (Basic vs Comprehensive)
    - CREATE (Basic vs Comprehensive)
    - Restore - SDR

## 0. What's remaining for May 30

> (todo) Make it clear what we can share with Private preview participants

- Startup page: readme.md approach
    > Eric / Karl

- UI Fit & Finish
    - Post an issue on GIT: M1Preview
    > All PMs

- Preview Acquisition
    - Delivery vehicle: download? email? yammer?
    - Management Tools yammer group / new yammer group for carbon.
        > Tara
		
4. Private preview logistics (complete)
    - **MVPs webinar**: start talking about carbon and inform about PostgreSQL support.
        - ETA: The week of 22 next week: Ask jennifer moser to setup webinar.
        > Sanjay to setup with Jennifer
 
    - PG community engagement
        - Ask Sunil to boot strap
        - Inform and ask for contribution:  start this week (Week of May 15).
 
    - Provide tar.gz / zip to bypass MS corpnet network access.
 
    - Linux egineering townhall - May 25th.
        - online (?)

