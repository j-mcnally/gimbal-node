var rest = require('restler');
var gimbal = (function() {
  return {
    access_token: "",
    getOrgInfo: function(callback) {
      rest.get('https://proximity.gimbal.com/oauth/token/info?access_token=' + this.access_token).on('complete', function(result) {
        callback(result);
      });
    },
    findBeacon: function(serviceId, mfid, callback) {
      mfid = mfid.toUpperCase();

      self = this
      this.getOrgInfo(function(orgInfo) {
        var orgId = orgInfo.organizations[0].uuid
        var url = 'https://proximity.gimbal.com/api/mbr/v1/transmitters/organization/' + orgId + '/resolve/' + mfid + '?service_id=' + serviceId + '&access_token=' + self.access_token
        rest.get(url).on('complete', function(result) {
          if (!result["error"]) {
            callback(result);
          }
        });
      });
    }
  }
})()

module.exports = gimbal