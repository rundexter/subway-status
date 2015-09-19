var http = require('http'),
  XmlStream = require('xml-stream');

module.exports = {
  /**
   * The main entry point for the Dexter module
   *
   * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
   * @param {AppData} dexter Container for all data used in this workflow.
   */
  run: function (step, dexter) {


    var subwayline = step.input('subwayline').first(),
      self = this;

    var hostx = "web.mta.info",
      pathx = "/status/serviceStatus.txt";

    //Let the parser grab the data
    self.getLineStatus(hostx, pathx, subwayline, function (subwaystatus) {

      var response = [],
        content = '';

      if (subwaystatus == 'GOOD SERVICE') {
        content = "Today's a good day - you might get in on time. We found no MTA issues on your line. " +
          "http://m.mta.info/mt/www.mta.info?un_jtt_v_ifnojs=Subway";
      } else {
        content =
        "Yea, you're gonna be late again, and your boss is gonna give you that look. We found " + subwaystatus.toLowerCase() +
        " on your line. See if Google can save you... http://maps.google.com";
      }

      content = "blah";

      response.push({
        subwayline: subwayline,
        subwaystatus: subwaystatus,
        statusmessage: content,
      });

      return self.complete(response);
    });

  },

  /*
   * Retrieve subway line status
   *
   */
  getLineStatus: function (hostx, pathx, subwayline, callback) {

    // Request an RSS for a Twitter stream
    var request = http.get({
      host: hostx,
      path: pathx
    }).on('response', function(response) {

      var xml = new XmlStream(response);

      // Pass the response as UTF-8 to XmlStream
      response.setEncoding('utf8');

      // When each item node is completely parsed, buffer its contents
      xml.on('endElement: service > subway > line', function(subwaystatus) {

        if (subwaystatus.name == subwayline) {
          callback(subwaystatus.status);
        }
      });
    });
  }
};
