# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project follows [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Changed
- BC-Break: the calendar option (-c or --calendar) is no longer a default option

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
