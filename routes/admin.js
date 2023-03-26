var express = require('express');
var router = express.Router();
const session = require("express-session");
const flash = require("express-flash");
const passport = require('passport');
var pg = require('pg');
var app = express();
const moment = require('moment');

var config = require('../dbConfig');

var pool = new pg.Pool(config);

router.use(
    session({
      secret: 'secret',

      resave: false,

      saveUninitialized: false
    })
);
router.use(passport.initialize());
router.use(passport.session());
router.use(flash());

const initializeAdmin = require('../passportAdmin')
const {Strategy: LocalStrategy} = require("passport-local");
initializeAdmin(passport);

function checkAdminAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/admin/dashboard");
  }
  next();
}

function checkAdminNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/admin/login");
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin', {title: 'Admin'});
});


router.get('/login', checkAdminAuthenticated,function(req, res, next) {
  res.render('admin-login', {title: 'Admin'});
});


router.post('/login', passport.authenticate('passportAdmin', {

  successRedirect: '/admin/dashboard',
  failureRedirect: '/admin/login',
  failureFlash: true
}));


router.get('/dashboard', checkAdminNotAuthenticated, (req, res, next) => {
    pool.query('select * from predavac;', async (err, result) => {
        if(err) {
            console.log(err);
        }
        var predavac = await result.rows;
        var brPredavaca = await result.rowCount;

        pool.query('select * from predavanja;', async (err, result) => {
            if (err) {
                console.log(err);
            }
            var predavanje = await result.rows;
            var brPredavanja = await result.rowCount;
            pool.query('select * from pitanja where deleted_at is not null;', async (err, result) => {
                if (err) {
                    console.log(err);
                }
                var pitanje = await result.rows;
                var brPitanja = await result.rowCount;

                pool.query('select * from odgovorena_pitanja;', async (err, result) => {
                    if(err) {
                        console.log(err);
                    }
                    var odg = await result.rows;
                    var brOdg = await result.rowCount;
                    pool.query('select * from sakrivena_pitanja;', async (err, result) => {
                        if(err) {
                            console.log(err);
                        }
                        var sak = await result.rows;
                        var brSak= await result.rowCount;

                        res.render('dashboard-admin', {predavac: predavac, brPredavaca: brPredavaca, predavanje:predavanje, brPredavanja: brPredavanja, pitanje: pitanje, brPitanja:brPitanja,
                            odg:odg, brOdg: brOdg, sak:sak, brSak: brSak, user: req.user.ime_prezime});
                    })

                })

            })
        })

    })


})

router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/admin/login');
  });
});

router.post('/blokirajPredavaca', (req, res, next) =>{
    let datum = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let id = req.body.blok;

    let novi = moment(datum, "YYYY-MM-DD HH:mm:ss").add(15, 'days');
    let noviFormatiran = novi.format('YYYY-MM-DD HH:mm:ss');
    pool.query('update predavac set blokiran=$1 where predavac_id=$2;', [noviFormatiran,id], (err,result) => {
        if(err) {
            throw err;
        }
        res.redirect('/admin/dashboard');
    })

});

router.post('/urediPredavaca', (req,res,next)=>{
    let id = req.body.urediPredavac;

    pool.query(`
        select * from predavac where predavac_id = $1;`,[id],
        (err, results)=>{
            if(err) throw err;

            res.render('admin-urediPredavaca', {predavac: results.rows});

        }
    );
});

router.post('/urediP', (req,res,next)=>{
    let ime = req.body.ime;
    let prezime = req.body.prezime;
    let id = req.body.idPredavaca;
    pool.query(`
        update predavac set ime=$1, prezime=$2 where predavac_id = $3`,[ime,prezime, id],
        (err, results)=>{
            if(err) throw err;


        }
    );
    res.redirect('/admin/dashboard');
});


router.post('/obrisiPredavaca', checkAdminNotAuthenticated,(req,res,next)=>{
    let id = req.body.obrisiPredavaca;

    pool.query(`
        delete from predavac where predavac_id = $1;`,[id],
        (err, results)=>{
            if(err) throw err;

            res.redirect('/admin/dashboard');

        }
    );
});

router.post('/obrisiPredavanje', (req,res,next)=>{
    let id = req.body.obrisiPred;

    pool.query(`
        delete from predavanja where predavanje_id = $1;`,[id],
        (err, results)=>{
            if(err) throw err;

            res.redirect('/admin/dashboard');

        }
    );
});

router.post('/urediPredavanje',checkAdminNotAuthenticated, (req,res,next)=>{
    let id = req.body.urediPred;

    pool.query(`
        select * from predavanja where predavanje_id = $1;`,[id],
        (err, results)=>{
            if(err) throw err;

            res.render('admin-urediPredavanje', {predavanje: results.rows});

        }
    );
});

router.post('/urediPred', (req,res,next)=>{
    let ime = req.body.ime;
    let pocetak = req.body.pocetak;
    let kraj = req.body.kraj;
    let id = req.body.idPredavanja;
    let kod = req.body.kod;
    console.info(ime,pocetak,kraj, id, kod)
    pool.query(`
        update predavanja set ime_predavanja=$1, pocetak_predavanja=$2,kraj_predavanja=$3
         ,kod_predavanja=$4 where predavanje_id = $5`,[ime,pocetak,kraj,kod, id],
        (err, results)=>{
            if(err) throw err;


        }
    );
    res.redirect('/admin/dashboard');
});


module.exports = router;
