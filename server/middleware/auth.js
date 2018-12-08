const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length > 0) {
    models.Sessions.get(req.cookies)
      .then((result) => {
          
      });
  } else {
    models.Sessions.create()
      .then((result)=> {
        return models.Sessions.get({'id': result.insertId});
      })
      .then(hash => {
        req.session = hash;
        res.cookies['shortlyid'] = {};
        res.cookies.shortlyid.value = hash.hash;
        next();
      })
      .catch(err => {
        res.status(500).send(err);
        res.end();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

