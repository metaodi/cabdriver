# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project follows [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Fixed
- Prevent internal server error for JIRA by always setting the `properties` query param (see also #51)

## 0.8.0 - 2017-07-03
### Added
- GitLab as a source

## 0.7.0 - 2017-06-28
### Fixed
- Show nice error message if jira fails (#51)
- Allow each jira issue to fail separately (i.e. get the information if possible)
- If one source fails, continue the command

### Changed
- Updated all dependencies (except by googleapis, as there seems to be an error with the release)

## 0.6.0 - 2017-06-27
### Added
- Github as a source (creates entries based on user activity)
- Unit tests + test coverage for the important parts of the application

### Changed
- Refactored modules with prototypes
- Renamed auth module to google_auth

### Removed
- Removed dependency to the moment.js plugin 'twix'

## 0.5.0 - 2017-05-10
### Added
- Make use of the limit parameter in the logbot API
- New option (-H/--hours) to change the output from time ranges to durations in hours (#39)

### Changed
- Updated all dependencies

### Fixed
- Error output when directory can't be accessed (#40)

## 0.4.2 - 2017-03-08
### Fixed
- Use string as default value for time in logbot to fix display problems 

## 0.4.1 - 2017-03-08
### Fixed
- Make sure logbot is correctly recognized as source by cabdriver, so it can be run "standalone"

## 0.4.0 - 2017-03-08
### Added
- Support for Logbot, so now you can create taxi entries via Slack, and get them out via cabdriver (see https://github.com/metaodi/logbot)

## 0.3.0 - 2017-02-17
### Added
- Taxi alias for zebra entries (thanks to Zebra 4.11, where the API now contains this information)

### Changed
- Updated all dependencies

## 0.2.1 - 2017-02-02
### Fixed
- Workaround for gitlog date bug (https://github.com/domharrington/node-gitlog/issues/28), so that all dates can be parsed correctly again

## 0.2.0 - 2017-02-02
### Changed
- The calendar option (-c or --calendar) is no longer a default option, altough if you do not have a config file and do not specify any other source, it will still be used

### Added
- There is now a config file at ~/.cabdriver/cabdriver.yml to save your default options (see README for details)

## 0.1.0 - 2016-12-12
### Added
- Added CHANGELOG for the whole history

## 0.0.20 - 2016-12-06
### Changed
- Add total of hours to each section title when possible

## 0.0.19 - 2016-12-05
### Changed
- Improve titles of each section

## 0.0.18 - 2016-12-05
### Added
- Pie charts for zebra

## 0.0.17 - 2016-11-29
## Added
- Zebra support

## 0.0.16 - 2016-11-02
### Added
- Verbose jira output
- Extract entries from Jira comments

## 0.0.15 - 2016-09-14
### Changed
- Fetch all sources in parallel instead of in series

## 0.0.14 - 2016-09-14
### Fixed
- Fix slack API call

## 0.0.13 - 2016-09-14
### Fixed
- Remove jira debug output
- clean exit at the end

## 0.0.12 - 2016-09-14
### Added
- Jira support

## 0.0.11 - 2016-09-06
### Changed
- Updated dependencies

### Added
- Verbose output for git respositories

## 0.0.10 - 2016-09-05
### Fixed
- pie chart parameter is called -p not -g

## 0.0.9 - 2016-09-05
### Fixed
- Hotfix for git error handler

## 0.0.8 - 2016-09-05
### Added
- Local git repositories support

## 0.0.7 - 2016-09-01
### Added
- Slack API integration

## 0.0.6 - 2016-08-31
### Changed
- check the response status of events. If you only accepted tentatively or declined, the entry is only added as a comment.

## 0.0.5 - 2016-06-09
### Added
- Google Mail support

## 0.0.4 - 2016-03-02
### Changed
-Increase default limit to 250 events

## 0.0.3 - 2016-03-01
### Fixed
- Documentation and help text

## 0.0.2 - 2016-03-01
### Added
- Add "bin" to package.json for cli 

## 0.0.1 - 2016-03-01
### Changed
- First release with release number

# Categories
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for once-stable features removed in upcoming releases.
- `Removed` for deprecated features removed in this release.
- `Fixed` for any bug fixes.
- `Security` to invite users to upgrade in case of vulnerabilities.
