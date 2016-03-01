cabdriver
=========

cabdriver is a small helper application that helps you to fill in your hours in taxi.
It currently support Google Calendar to get entries in a taxi-friendly format.

## Usage

```bash
$ cabdriver -n 10 -d last-month

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

```bash
$ cabdriver -d 01.03.2016-05.03.2016 -n 100
```

## Options

For a complete help run `cabdriver --help`.

* `-n --number` number of entries to return (default: 10)
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
