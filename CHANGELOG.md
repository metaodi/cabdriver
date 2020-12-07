# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project follows [Semantic Versioning](http://semver.org/).

## [Unreleased][unreleased]
### Fixed
- Make sure to correctly join the config path #121
- For git source: check the error message in property or the error itself #122

## 4.0.0 - 2020-12-05
### Fixed
- Check HOMEDRIVE and HOMEPATH for cabdriver directory #109
- Fixed gitlog error see #112
- Fixed deprecation warnings from octokit

### Changed
- **BC-break:** Due to updated dependencies, now at least node 12.0.0 is required
- Updated a bunch of dependencies

### Removed
- Removed gulp + gulpfile as a dependency

## 3.0.0 - 2019-12-08
### Fixed
- Fixed Before-after-hook warning (#106), thanks @stefina #102

### Changed
- **BC-break:** Due to updated dependencies, now at least node 8.10.0 is required
- Updated npm dependencies #107
- Switched from Travis CI to GitHub Actions

## 2.5.1 - 2019-10-07
### Fixed
- Hotfix for google authentication

## 2.5.0 - 2019-10-07
### Fixed
- Re-created google authentication so that people can create new tokens and login again

## 2.4.0 - 2018-07-26
### Fixed
- Display of `zebra` time was wrong, now everything should be properly aligned and spaced

### Changed
- Add default time (1 hour) to `mail` and `git` source
- Change display of mail source (shorter subject, extract name from header)

## 2.3.4 - 2018-07-18
### Fixed
- In between check in jira module did not work for "today", apply startOf()/endOf() to fix this

## 2.3.3 - 2018-07-10
### Fixed
- Handle empty pages in pagination for mail and calendar source

## 2.3.2 - 2018-07-04
### Fixed
- Pagination for mail and calendar source

## 2.3.1 - 2018-07-04
### Fixed
- Added missing `request` dependency

## 2.3.0 - 2018-07-04
### Added
- Configure query/labels of mail source to limit output (#70)

### Changed
- Update all npm dependencies
- Move `auth` classes in their own directory
- Move `source` classes in their own directory

## 2.2.3 - 2018-06-26
### Fixed
- Add `cab-*` sub-commands to bin in package.json (fixes #74)

## 2.2.2 - 2018-06-26
### Fixed
- Fixed github promise resolver and always compare to start of day

## 2.2.1 - 2018-04-18
### Fixed
- Fixed test that always failed at midnight due to stupid timezone bug

## 2.2.0 - 2018-04-09
### Added
- Pagination for calendar source (necessary if you have lots of events to fetch)

## 2.1.0 - 2018-04-03
### Added
- A local persistent cache is provided for various sources to improve the overall performance of cabdriver (check the README for details about the caching)

### Changed
- The github events response is cached locally when running cabdriver for github multiple times
- The paths to local git repositories are cached locally
- Google mails are cached locally (helps to reduce API calls)

## 2.0.2 - 2018-03-29
### Fixed
- Fix semver definition of node version in package.json

## 2.0.1 - 2018-03-29
### Fixed
- Always use start of day for calendar source, before entries during the day would not show up

## 2.0.0 - 2017-12-12
### Added
- New feature to map entries to projects using regular expressions (matching against the `text` and the `project` fields of the entry)

### Changed
- BC-break: Due to updated dependencies, now at least node 6.11.0 is required
- Updated npm dependencies

## 1.1.1 - 2017-10-28
### Fixed
- Automatic deployment via Travis CI to NPM

## 1.1.0 - 2017-10-28
### Added
- Add `cab` as short command to the cli (instead of having to type `cabdriver`)
- Split cabdriver into different commands (backwards-compatible), i.e. `fetch` is the default command to get entries, `sheet is a new command to generate empty taxi files

### Changed
- Updated all npm dependencies
- Usage of GitLab API v4 (i.e. GitLab >= 9.0 is now required)

### Fixed
- Bugfix for detecting sources in CLI options (in some cases this detection didn't work correctly)

## 1.0.0 - 2017-07-19
### Security
- Make sure the minimum node version is 4.8.4 due to a vulnerability in node (see https://nodejs.org/en/blog/vulnerability/july-2017-security-releases/)

### Changed
- Major refactoring to use ES6 classes and use promises instead of callbacks
- BC-Break: `cabdriver` changed to ES6 classes, therefore node >= 4.0.0 is now required
- BC-Break: the token file for google was renamed, previously it was called `calendar-nodejs-token.json` now it is simply called `google-token.json`. This might cause, that you have to re-authorize cabdriver to access your calendar and mail. You can simply rename the file in `~/.cabdriver` to avoid this.

## 0.8.1 - 2017-07-07
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
