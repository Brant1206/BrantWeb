const express = require('express');
const expressHandlebars = require('express-handlebars');

const app = express();

const port = process.env.PORT || 3000;

const fortune = require('./lib/fortune');
const handlers = require('./lib/handlers');
const weatherMiddlware = require('./lib/middleware/weather');

//處理基本表單傳值
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//停用Express預設的x-powered-by(表明用於支援當前網頁應用程式的技術)
app.disable('x-powered-by')
//引用public
app.use(express.static(__dirname + '/public'))
//設置Handlebars view引擎//使用section
app.engine('handlebars', expressHandlebars({
    defaultLayout: 'main',
    helpers:{
        section: function(name, options){
            if(!this._sections) this._sections = {}
            this._sections[name] = options.fn(this)
            return null
        },
    },
}))

app.set('view engine', 'handlebars')
//啟用VIEW快取 開發模式預設停用
app.set('view cache', true)

//透過echo-headers
/*app.get('/', handlers.home);
app.get('/about', handlers.about);
app.get('/headers', handlers.headers);
app.use(handlers.notFound);
app.use(handlers.serverError);
*/

//使用middleware
app.use(weatherMiddlware)
app.get('/', (req, res) =>{
    res.render('home');
})

app.get('/about', (req, res) =>{
    res.render('about', { fortune: fortune.getFortune() });
})

app.get('/headers', (req, res) => {
    console.log(req)
    console.log(res)
    res.type('text/plain')
    const headers = Object.entries(req.headers)
        .map(([key, value]) => `${key}:  ${value}`)
    res.send(headers.join('\n'))
})

//將內容傳給view(字串、COOKIE、SESSION) req沒拿到cookie、session
app.get('/greeting', (req, res) => {
    console.log(req)
    res.render('about', {
        message: 'Hello esteemed programmer!',
        style: req.query.style,
        userid: req.cookies.userid,
        username: req.session.username
    })
})

//測試layout沒值
app.get('/no-layout', (req, res) => {
    res.render('no-layout', { layout: null })
})

//測試layout有值
app.get('/custom-layout', (req, res) => {
    res.render('custom-layout', { layout: 'custom' })
})

//純文字
app.get('/text', (req, res) => {
    res.type('text/plain')
    res.send('this is a test')
})

app.get('/thank-you', (req, res) => res.render('11-thank-you'))
app.get('/contact-error', (req, res) => res.render('11-contact-error'))

//基本表單處理6-9
/*app.post('/process-contact', (req, res) => {
    console.log(`received contact from ${req.body.name} <${req.body.email}>`)
    res.redirect(303, '/thank-you')
})*/

//較穩健的表單處理6-10
app.post('/process-contact', (req, res) => {
    try{
        //嘗試將contack傳入資料庫或其他持久保存機制，目前只模擬一個錯誤
        if(req.body.simulateError) throw new Error("error saving contact!")
        console.log(`contact from ${req.body.name} < ${req.body.email} >`)
        res.format({
            'text/html': () => res.redirect(303, '/thank-you'),
            'application/json': () => res.json({ success: true }),
        })
    }catch(err){
        //處理任何保存失敗
        console.error(`error processing contact from ${req.body.name} <${req.body.email}>`)
        res.format({
            'text/html': () => res.redirect(303, '/contact-error'),
            'application/json': () => res.status(500).json({ error: 'error saving contact information' }),
        })
    }
})

//只回傳JSON的簡單GET端點6-11
const tours = [
    { id: 0, name: 'Hood River', price: 99.99 },
    { id: 1, name: 'Oregon Coast', price: 149.95 },
]
app.get('/api/tours', (req, res) => res.json(tours))
/*app.get('/api/tours', (req, res) => res.format({
    'text/plain': function(){ res.send(tours) }}))*/
//回傳JSON、XML或文字的GET端點6-12
app.get('/api/tours2', (req, res) => {
    const toursXml = '<?xml version="1.0"?><tours>' +
    tours.map(p=>
        `<tour price="${p.price}" id="${p.id}">${p.name}</tour>`
        ).join('') + '</tours>'
    const toursText = tours.map(p =>
        `${p.id}: ${p.name} (${p.price})`
        ).join('\n')
    res.format({
        'application/json': () => res.json(tours),
        'application/xml': () => res.type('application/xml').send(toursXml),
        'text/xml': () => res.type('text/xml').send(toursText),
        'text/plain': () => res.type('text/plain').send(toursText),
    })
})


//用來更新的PUT端點6-13(利用POSTMAN傳值測試)
app.put('/api/tour/:id', (req, res) => {
    const p = tours.find(p => p.id === parseInt(req.params.id))
    if(!p) return res.status(404).json({ error: 'No such tour exists' })
    if(req.body.name) p.name = req.body.name
    if(req.body.price) p.price = req.body.price
    res.json({ success: true })
})
//用於刪除的DELETE端點6-14(利用POSTMAN傳值測試)
app.delete('/api/tour2/:id', (req, res) => {
    const idx = tours.findIndex(tour => tour.id === parseInt(req.params.id))
    if(idx < 0) return res.json({ error: 'No such tour exists' })
    tours.splice(idx, 1)
    res.json({ success: true })
})
//測試hbs參數傳遞
const data = {
    currency: {
        name: 'United States dollars',
        abbrev: 'USD',
    },
    tours:[
        { id: 0, name: 'Hood River', price: 99.99 },
        { id: 1, name: 'Oregon Coast', price: 149.95 },
    ],
    specialUrl: '/january-specials',
    currencies: [ 'USD', 'GBP', 'BTC'],
}
app.get('/hbs-test', (req, res) => {
    res.render('hbs-test', { data: data })
})

app.get('/sectiontest', (req, res) => {
    res.render('sectiontest')
})

//自訂404網頁
app.use((req, res) => {
    res.status(404).render('404')
})

//自訂500網頁
app.use((err, req, res, next) => {
    console.error('** SERVER ERROR: ' + err.message)
    res.status(500).render('500', { message: "you shouldn't have clicked that!" })
})

if(require.main === module){
    app.listen(port, () => {
        console.log('Express started on http://localhost:${port} ' +
        'press Ctrl-C to terminate')
    });
}else{
    module.exports = app;
}