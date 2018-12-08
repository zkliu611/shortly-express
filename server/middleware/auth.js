const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length > 0) {
    models.Sessions.get({'hash': req.cookies.shortlyid})
      .then((result) => {
        req.session = result;
        res.cookie('shortlyid', result.hash);
        next();
      })
      .catch(err => {
        res.status(500).send(err);
        res.end();
      });
  } else {
    models.Sessions.create()
      .then((result)=> {
        return models.Sessions.get({'id': result.insertId});
      })
      .then(hash => {
        req.session = hash;
        res.cookie('shortlyid', hash.hash);
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

