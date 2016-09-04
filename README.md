[![Build Status](https://travis-ci.org/metaodi/cabdriver.svg?branch=master)](https://travis-ci.org/metaodi/cabdriver)

cabdriver
=========

cabdriver is a small helper application that helps you to fill in your hours in taxi.
It currently support Google Calendar, Google Mail and Slack to get entries in a taxi-friendly format.

## Installation

Make sure you have [Node.js](https://nodejs.org/en/) installed.

```bash
npm install -g cabdriver
```

### Usage

```bash
$ cabdriver -n 10 -d yesterday

02/02/2016 # Tuesday
xxx    09:00-10:00   opendata.swiss Go-Live
xxx    09:30-09:45   Jazz Daily Stand-Up
xxx    10:05-10:30   Weiteres Vorgehen Vowi
xxx    10:30-12:00   Analyse Altium
xxx    13:30-14:00   IPA-Besprechung
xxx    16:00-19:00   Byebye Apero Lukas

03/02/2016 # Wednesday
xxx    09:30-09:45   Jazz Daily Stand-Up
xxx    10:00-10:30   Support Backlog
xxx    10:45-11:30   HWZ Preplanning
xxx    14:00-15:00   HWZ DoD
```


#### Entries from 01.03.2016 until 05.03.2016, max. 100 results
```bash
$ cabdriver -d 01.03.2016-05.03.2016 -n 100
```

#### Google Mail

```bash
$ cabdriver -d last-month --mail
```

#### Slack

Text entries:
```bash
$ cabdriver -d last-month --slack
```

Graphic (pie chart):
```bash
$ cabdriver -d last-month --slack --graph
```
[![cabdriver with slack pie chart](http://i.imgur.com/KcPgjcU.png)](#)

#### Git

Find my commits from the 01.09.2016 in all git repositories in `/home/odi/projects`:
```bash
$ cabdriver -d 01.09.2016 -g /home/odi/projects
```


### Options

For a complete help run `cabdriver --help`.

* `-n --number` number of entries to return (default: 250)
* `-d --date` supports date strings or ranges (default: today):
  * 31.12.2016
  * 01.12.2016-31.12.2016
  * yesterday
  * last-week
  * past-week (7 days)
  * last-month (month before the current)
  * past-month (30 days)
  * last-year (year before the current)
  * past-year (365 days)
  * today (up to current time)
  * this-week (up to current time)
  * this-month (up to current time)
  * this-year (up to current time)
* `-c --calendar` choose the calendar for the entries (default: primary)
* `-m --mail` generate entries from mails
* `-s --slack` generate entries from slack
* `-g --git <path>` generate entries from your local git repositories (defaults to current directory)
* `-p --pie` generate pie chart instead of text (currently only for slack)
* `-v --verbose` verbose output

## Tests

To run the tests use the following command:

```bash
npm test
```

## Release

To create a new release follow these steps:

1. Update the version number in `package.json`
1. Create a [new release/tag on GitHub](https://github.com/metaodi/cabdriver/releases)
1. Publish the release with npm: `npm publish`
