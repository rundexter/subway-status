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

      var response = [];

      response.push({
        subwayline: subwayline,
        status: subwaystatus,
        mtalink: 'http://mta.info',
        googlemapslink: 'http://gmaps.com'
      });



      return self.complete(response);
    });

  },

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
