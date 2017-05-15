# Milestone Roadmpa


## Milestones
    - M1: Private preview May 30 (June 2)
    - M2: Public previewJune 30

## Socialization: Executive Overview

Sanjay to initiate Executive Overview and socialization with LTs.

- Socializing with LTs
    - Scottgu
    - Joseph
    - R.Kumar's directs 
    - Partnership
        - Redgate
        - SQL Sentry
        - mladen prajck 

## 0. What's remaining for May 30

> (todo) Make it clear what we can share with Private preview participants

## 1. Wrapping up feature designs for June 30

- .NET 2.0 core + Windows Auth
    > m1: check the feasibility

- Acquisition
    - M1: tar.gz, zip where preview users to download and unzip to a local folder without requiring network download for service components.

- Version 0.1 experience
    - OE (register server & group and browse server & database)
        - M1: OE full scope 
        - M1: OE search - search for server / database names only. 

        > (todo) design for the full object SEARCH functionality 

    - CREATE experience e.g CREATE database
        - M1: create database punch through experience to show case the CREATE experience and collect user feedback.
    
    - MANAGE (dashboard)
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

    - DELETE (DROP DDL)
            - M1: Not in scope
            - M2: Delete 
                > design: close all active connection. show dependency

    - SCRIPT AS: CREATE
        - mssql-scripter for database node.
            - M1: ??
        - M1: script as database, table, etc
        
    - SQL Editor
        - M1: Full scope

    - Data Edit
        - M1: early bits to collect user feedback.

    - Connection
        - SQL
            - M1: Full
        - PGSQL*
            - M1: ??
        
    - Recovery
        - Backup
            - M1: early punch through
        - Restore
            - M1: not in scope

- PG functionalities
    - Basic connectivity
    - Editor
    - * (all of above?)

-------- June 30 mark --------
- HA
    - AG Operations - Manual Failover
    - AG Configuration
    > GA blocker

- Showplan
    > GA blocker

- mssql-scripter (sqldump)


2. OSS & Branding to go public

    - Get the branding naming request template from Sanjay 
    - Initiate it with naming council
    - Present to marketing taem (Joanne and Mitra)

    - start OSS process w/o the official name (3 weeks). Update the project / product name after the branding name is finalized.

3. Release collaterals 
    _ Readme
    - Getting started docs 
    - Release Note

4. Private preview logistics
    - MVPs webinar: start talking about carbon and inform about PostgreSQL support.

        - target The week of 22 next week: Ask jennifer moser to setup webinar.

    - PG community engagement
        - Ask Sunil to boot strap
        - Inform and ask for contribution:  start this week (Week of May 15).

    - Provide tar.gz / zip to bypass MS corpnet network access.

    - Linux egineering townhall - May 25th.
        - online (?)

