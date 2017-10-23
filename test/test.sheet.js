/*jshint expr: true*/
var Sinon = require('sinon');
var stdMocks = require('std-mocks');
var expect = require('chai').expect;

var SheetCli = require('../cli/sheet');

var sandbox = Sinon.sandbox.create();

describe('CLI Sheet', function() {
    afterEach(function () {
        sandbox.restore();
        stdMocks.restore();
    });

    describe('printSheet', function() {
        it('should print a correct sheet for a given month', function() {
            //setup mocks
            stdMocks.use();

            var cli = new SheetCli({'month': '09', 'year': '2017'});
            cli.printSheet();
            var output = stdMocks.flush().stdout;
            stdMocks.restore();
            var expectedOutput = [
            	"# taxi file for 09.2017\n\n",
                "01/09/2017 # Friday\n\n",
                "02/09/2017 # Saturday\n\n",
                "03/09/2017 # Sunday\n\n",
                "04/09/2017 # Monday\n\n",
                "05/09/2017 # Tuesday\n\n",
                "06/09/2017 # Wednesday\n\n",
                "07/09/2017 # Thursday\n\n",
                "08/09/2017 # Friday\n\n",
                "09/09/2017 # Saturday\n\n",
                "10/09/2017 # Sunday\n\n",
                "11/09/2017 # Monday\n\n",
                "12/09/2017 # Tuesday\n\n",
                "13/09/2017 # Wednesday\n\n",
                "14/09/2017 # Thursday\n\n",
                "15/09/2017 # Friday\n\n",
                "16/09/2017 # Saturday\n\n",
                "17/09/2017 # Sunday\n\n",
                "18/09/2017 # Monday\n\n",
                "19/09/2017 # Tuesday\n\n",
                "20/09/2017 # Wednesday\n\n",
                "21/09/2017 # Thursday\n\n",
                "22/09/2017 # Friday\n\n",
                "23/09/2017 # Saturday\n\n",
                "24/09/2017 # Sunday\n\n",
                "25/09/2017 # Monday\n\n",
                "26/09/2017 # Tuesday\n\n",
                "27/09/2017 # Wednesday\n\n",
                "28/09/2017 # Thursday\n\n",
                "29/09/2017 # Friday\n\n",
                "30/09/2017 # Saturday\n\n"
            ];
            expect(output).to.deep.equal(expectedOutput);
        });
    });
});

