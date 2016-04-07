var http      = require('http')
  , XmlStream = require('xml-stream')
  , _         = require('lodash')
  , q         = require('q')
;

module.exports = {
  /**
   * The main entry point for the Dexter module
   *
   * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
   * @param {AppData} dexter Container for all data used in this workflow.
   */
  run: function (step, dexter) {
    var subwaylines = step.input('subwayline')
      , self       = this
      , hostx      = "web.mta.info"
      , pathx      = "/status/serviceStatus.txt"
      , promises   = []
      , items      = []
      , line
    ;

    if(subwaylines.length === 1) {
        line = subwaylines.first();
        if(line) 
            subwaylines = line.split(',');
    }



    _.each(subwaylines, function(subwayline) {
        //Let the parser grab the data
        //

        promises.push(
            q.ninvoke(self, 'getLineStatus', hostx, pathx, subwayline).timeout(5000, 'Timed out checking '+subwayline)
        );
    });


    q.all(promises)
        .then(function (results) {
            _.each(results, function(data) {
                var response = []
                  , content  = ''
                  , status = _(data.status).uniq().map(_.lowerCase).value().join(',')
                ;

                if (status.match(/^good service/i)) {
                    content = "Today's a good day - you might get in on time. We found no MTA issues on the "+data.line+" line. " +
                        "http://m.mta.info/mt/www.mta.info?un_jtt_v_ifnojs=Subway";
                } else {
                    content =
                    "Yea, you're gonna be late again. We found " + status + " on the " + data.line + " line.";
                }

                items.push({
                    subwayline    : data.subwayline,
                    subwaystatus  : status,
                    statusmessage : content,
                });
            });

            return items;
        })
        .then(self.complete.bind(self, items))
        .catch(self.fail.bind(self));

  },

  /*
   * Retrieve subway line status
   *
   */
  getLineStatus: function (hostx, pathx, subwayline, callback) {
      var state = {
          status: [],
          line  : subwayline
      };

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
              if (subwaystatus.name.toLowerCase().match(subwayline.toLowerCase())) {
                  state.status.push(subwaystatus.status);
              }
          });

          xml.on('end', function() {
             if(!state.status.length) state.status.push('NOT_FOUND');
             callback(null, state);
          });
      });
  }
};
