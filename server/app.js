const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const db = require('./db');
const Promise = require('bluebird');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));



app.get('/', (req, res) => {
  res.render('index');
});

app.get('/create', (req, res) => {
  res.render('index');
});

app.get('/links', (req, res, next) => {
  models.Links.getAll()
    .then(links => {
      res.status(200).send(links);
    })
    .error(error => {
      res.status(500).send(error);
    });
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', (req, res) => {
  models.Users.create(req.body)
    .then(() => {
      res.location('/');
      res.sendStatus(201);
      res.end();
    })
    .catch(() =>{
      res.location('/signup');
      res.sendStatus(422);
      res.end();
    });
});

let promiseQuery = (sql) => new Promise((resolve, reject) => {
  db.query(sql, (err, results) => {
    if (err) {
      reject(err);
    }
    resolve(results);
  });
});

app.post('/login', (req, res) => {
  let sql = `SELECT * From users where username = '${req.body.username}'`;
  promiseQuery(sql)
    .then(results => {
      let password = results[0].password;
      let salt = results[0].salt;
      return models.Users.compare(req.body.password, password, salt);
    })
    .then((result) => {
      if (result) {
        Auth.createSession(req, res, null);
        res.location('/');
        res.sendStatus(201);
        res.end();
      } else {
        res.location('/login');
        res.sendStatus(422);
        res.end();
      }
    })
    .catch(()=> {
      res.location('/login');
      res.sendStatus(500);
      res.end();
    });
});



/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
