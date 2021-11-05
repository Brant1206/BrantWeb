const fortune = require('./fortune');

exports.home = (req, res) => res.render('home');

exports.about = (req, res) => res.render('about', { fortune: fortune.getFortune() });

exports.headers = (req, res) => {
    res.type('text/plain')
    const headers = Object.entries(req.headers)
        .map(([key, value]) => `${key}: ${value}`)
    res.send(headers.join('\n'))
}

exports.notFound = (req, res) => {
    res.status(404);
    res.render('404');
}

exports.serverError = (err, req, res, next) => {
    res.status(500);
    res.render('500');
}