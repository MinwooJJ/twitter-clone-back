exports.isSignedIn = (req, res, next) => {
  // true면 signin
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send('Sign In Required');
  }
};

exports.isNotSignedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.status(401).send('Users who are not signed in can access');
  }
};
