const parseCookies = (req, res, next) => { 
  if (req.headers.cookie) {
    let cookiesArray = req.headers.cookie.split('; ');
    var cookies = {};
    for (let i = 0; i < cookiesArray.length; i++) {
      var array = cookiesArray[i].split('=');
      cookies[array[0]] = array[1];
    } 
    req.cookies = cookies;
  } else {
    req.cookies = {};
  }
  next();
};

module.exports = parseCookies;