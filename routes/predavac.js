var express = require('express');
var router = express.Router();
var randomize = require('randomatic');
const session = require("express-session");
const flash = require("express-flash");
const passport = require('passport');
var pg = require('pg');
const bcrypt = require("bcrypt");
const {Strategy: LocalStrategy} = require("passport-local");
const nodemailer = require("nodemailer");
//const session = require("express-session");
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

const initializePredavac = require('../passportConfig')
initializePredavac(passport);

function checkPredavacAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/predavac/dashboard");
    }
    next();
}

function checkPredavacNotAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {

        return next();
    }
    res.redirect("/predavac/login");
}

router.post('/login', passport.authenticate('passportPredavac', {

    successRedirect: '/predavac/dashboard',
    failureRedirect: '/predavac/login',
    failureFlash: true
}));


router.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/predavac/login');
    });
});


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('predavac', {title: 'Predavac'});
});

router.get('/registracija',checkPredavacAuthenticated,function(req, res, next) {
    console.info("ovdjeee")
  res.render('registracija', {title: 'Registracija'});
});


router.post("/registracija", async(req, res) =>{
    let { name,prezime, email, password, password2 } = req.body;

    console.info({

        name,
        email,
        password,
        password2
    });

    let errors = [];

    if(!name || !email || !password || !password2){
        errors.push({messagge: "Molim vas unesite sva polja"});
    }

    if(password.length < 6){
        errors.push({message: "Password mora imati minimalno 6 znakova"});
    }

    if(password != password2){
        errors.push({message: "Passwordi se ne podudaraju"});

    }

    if(errors.length > 0){
        res.render("registracija", { errors });
    }else{
        // forma zadovoljena idemo dalje

        let hashedPassword = await bcrypt.hash(password, 10);
        console.info(hashedPassword);

        pool.query(
            `SELECT * FROM predavac
         WHERE email = $1`,
            [email], (err, results) =>{
                if(err)
                    throw err;

                console.info(results.rows);

                if(results.rows.length > 0){
                    errors.push({message: "Email je vec registrovan"});
                    res.render('registracija', {errors});
                }else{
                    console.info('else');
                    pool.query(
                        `INSERT INTO predavac(ime,prezime, email, password)
                   VALUES($1, $2, $3, $4)`,[name,prezime, email, hashedPassword], (err, results) => {
                            if(err){
                                throw err;
                            }
                            console.info(results.rows);
                            req.flash('success_msg', 'Registrovani ste, logujte se.');
                            res.redirect('/predavac/login');
                        }
                    );

                }
            }
        );

    }
});


router.get('/login', checkPredavacAuthenticated,function(req, res, next) {
  res.render('predavac-login', {title: 'Predavac'});
});


router.get('/dashboard',checkPredavacNotAuthenticated, function(req, res, next) {
    res.render('dashboard-predavac', {title: 'Dashboard', user: req.user.ime});
});



router.get('/predavac/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/predavac/login');
  });
});
const fileUpload = require('express-fileupload');
app.use(fileUpload());
router.use(fileUpload());

const mv = require('mv');

router.post('/dashboard-predavac', checkPredavacNotAuthenticated,(req, res, next)=>{
  let predavacId = req.user.predavac_id;
  console.info(predavacId);
    var file;
    console.log(req.files);


    slika = req.files.slikaPredavanja;  // here is the field name of the form

   // const uploadPath =  '/stylesheets/upload/' + slika.name;
    const uploadPath = './public/upload/' + slika.name;

    slika.mv(uploadPath, async function(err) {
        if(err) {
            throw err;
        }
    })

    console.info(req.body);
    let a = randomize('0', 5);
    pool.query(`insert into predavanja (ime_predavanja, predavac_id, pocetak_predavanja
               ,kraj_predavanja, kod_predavanja, slika)
          values ($1,$2,$3,$4,$5,$6);`,
        [req.body.imePredavanja, predavacId, req.body.start, req.body.end, a,slika.name], (err, results)=>{
          if(err){
            throw err;
          }
          req.kod = a;
          console.info("jedan")
            next();
        }

    );
}, (req,res,next)=>{
    req.predavanjeId;
    pool.query(
        `select predavanje_id from predavanja where kod_predavanja=$1`,
        [req.kod],
        (err, results)=>{
            if(err) throw err;
            req.predavanjeId = results.rows[0].predavanje_id;
            console.info("dva");
            next();
        }
    );


}, (req,res,next)=>{
    pool.query(
        `insert into pitanja (predavanje_id, kod_predavanja,pitanje) values($1,$2,$3)`,
        [req.predavanjeId, req.kod, "Welcome"],
        (err,results)=>{
            if(err) throw err;
            console.info(req.predavanjeId, req.kod);
            console.info("random pitanje");
        }
    );
    res.redirect('/predavac/dashboard');
});



router.get('/registracija', checkPredavacAuthenticated,function(req, res, next) {
    console.info('reg');
  res.render('registracija', {title: 'Registracija'});
});










router.get('/dashboard/listaPredavanja',checkPredavacNotAuthenticated, function(req, res, next) {
     let predavacId = req.user.predavac_id;
     let rez;
     console.log("usao u get listaPredavanja" + predavacId);
    pool.query(
        `select * from predavanja where predavac_id = $1;`,
        [predavacId], (err, results)=>{
            if(err){
                throw err;
            }
            console.log(results.rows[0]);
            rez = results.rows;
            res.render('listaPredavanja', {title: 'Lista predavanja za predavaca', user: req.user.ime_prezime, p:rez});
        }


    );

    console.log(rez);


});

var io = null;




router.post ('/dashboard/listaPredavanja/:idPredavanja',checkPredavacNotAuthenticated, (req, res, next)=>{
        console.info("Predavac ID je",req.user.predavac_id);
        console.info("Predavanje ID je", req.params.idPredavanja);
        console.info("Kod1 je" ,req.body.kod);
        console.info("Kod2 je", req.body.keraa);

        let kod = req.body.kod;
        let kod1 = req.body.keraa;
        let predavacId = req.user.predavac_id;
        let predavanjeId = req.params.idPredavanja;
        let rez;
        console.log("usao u post :idPredavanja" + predavacId);

        if(req.body.sort == 1){
            console.info("prva opcija");
            pool.query(
                `select * from predavanja where predavanje_id = $1`,
                [predavanjeId],
                async (err, results) => {
                    if (err) {
                        throw err;
                    }
                    req.predavanja = await results.rows;
                    console.info(req.predavanja);

                });
            pool.query(
                `select * from pitanja where predavanje_id=$1 and deleted_at is  null order by pitanje_id asc`,
                [predavanjeId], async(err, results)=>{
                    if(err){
                        throw err;
                    }
                    req.pitanja1 = await results.rows;
                    console.info(req.predavanja);
                    res.render('chat-predavac', {predavanja:req.predavanja, pitanja:req.pitanja1});

                }
            );

        }

        if(req.body.sort == 2){
            console.info("druga opcija");
            pool.query(
                `select * from predavanja where predavanje_id = $1`,
                [predavanjeId],
                async (err, results) => {
                    if (err) {
                        throw err;
                    }
                    req.predavanja2 = await results.rows;
                    console.info(req.predavanja);

                });
            pool.query(
                `select * from pitanja where predavanje_id=$1 and deleted_at is  null order by pitanje_id desc`,
                [predavanjeId], async(err, results)=>{
                    if(err){
                        throw err;
                    }
                    req.pitanja2 = await results.rows;
                    console.info(req.predavanja);
                    res.render('chat-predavac', {predavanja:req.predavanja2, pitanja:req.pitanja2});

                }
            );


        }

        if(req.body.sort == 3){
            console.info("treca opcija");
            pool.query(
                `select * from predavanja where predavanje_id = $1`,
                [predavanjeId],
                async (err, results) => {
                    if (err) {
                        throw err;
                    }
                    req.predavanja3 = await results.rows;
                    console.info(req.predavanja3);

                });


            pool.query(
                `select * from pitanja where predavanje_id=$1 and deleted_at is  null order by likes desc`,
                [predavanjeId], async(err, results)=>{
                    if(err){
                        throw err;
                    }
                    req.pitanja3 = await results.rows;
                    console.info(req.pitanja3);
                    res.render('chat-predavac', {predavanja:req.predavanja3, pitanja:req.pitanja3});

                }
            );

        }

        if(req.body.sort == 4){
            pool.query(
                `select * from predavanja where predavanje_id = $1`,
                [predavanjeId],
                async (err, results) => {
                    if (err) {
                        throw err;
                    }
                    req.predavanja4 = await results.rows;

                });



            pool.query(
                `select * from pitanja where predavanje_id=$1 and deleted_at is  null order by likes desc`,
                [predavanjeId], async(err, results)=>{
                    if(err){
                        throw err;
                    }
                    req.pitanja4 = await results.rows;
                    res.render('chat-predavac', {predavanja:req.predavanja4, pitanja:req.pitanja4});

                }
            );
        }

        pool.query(
            `select * from predavanja where predavanje_id = $1;`,
            [predavanjeId], (err, results)=>{
                if(err){
                    throw err;
                }
                console.log(results.rows[0]);
                //res.render('chat-predavac', { p:rez});
                req.predavanje = results.rows;
                next();
            }


        );
    },
    (req, res, next) =>{
        let predavanjeId = req.params.idPredavanja;
        pool.query(
            'select * from pitanja where predavanje_id = $1 and deleted_at is null order by pitanje_id;',
            [predavanjeId],
            (err, results2)=>{
                if(err){
                    throw err;
                }
                console.log(results2.rows);
                req.pitanja = results2.rows;
                next();
                //res.render('chat-predavac', {predavanja: req.predavanje, pitanja: req.pitanja});
            }
        );
    },(req,res,next)=>{
        let predavanjeId = req.params.idPredavanja;
        pool.query(
        `select * from sakrivena_pitanja where predavanje_id=$1 order by pitanje_id`,[predavanjeId],
        (err, results)=>{
            if(err){
                throw err;
            }
            res.render('chat-predavac', {predavanja: req.predavanje, pitanja: req.pitanja, sakrivena:results.rows});

        }
    );
    });

router.get ('/dashboard/listaPredavanja/:idPredavanja',checkPredavacNotAuthenticated, (req, res, next)=>{
    console.info(req.user.predavac_id);
    console.info(req.params.idPredavanja);
    let predavanjeID = req.params.idPredavanja;
    let rez;
    pool.query(
        `select * from predavanja where predavanje_id = $1;`,
        [predavanjeID], (err, results)=> {
            if (err) {
                throw err;
            }
            rez = results.rows;

            res.render('chat-ulaz');

        });
});

router.get ('/dashboard/listaPredavanja/:idPredavanja/kod',checkPredavacNotAuthenticated, (req, res, next)=>{
    let predavacId = req.user.predavac_id;
    let rez;
    let k = req.params.idPredavanja;
    console.info(k);
    console.log("usao u get" + predavacId);
    pool.query(
        `select * from predavanja where predavanje_id = $1;`,
        [k], (err, results)=>{
            if(err){
                throw err;
            }
            console.log(results.rows);
            rez = results.rows;
            res.render('kod', {p:rez});
        }


    );
    //res.render('kod', {p:rez});
});

router.get('/dashboard/listaPredavanja/:idPredavanja/sakrivena', checkPredavacNotAuthenticated,(req,res,next)=>{
    console.info(req.params.idPredavanja)
    pool.query(
        `select * from sakrivena_pitanja where predavanje_id=$1`,[req.params.idPredavanja],
        (err, results)=>{
            if(err) throw err;
            req.sakrivena = results.rows;
            next();
        }
    );
}, (req,res,next)=>{
    pool.query(
        `select * from odgovorena_pitanja where predavanje_id=$1`,[req.params.idPredavanja],
        (err, results)=>{
            if(err) throw err;
            res.render('sakrivena', {sakrivena:req.sakrivena, odgovorena:results.rows});

        }
    );
});

router.post ('/dashboard/listaPredavanja/:idPredavanja/kod',checkPredavacNotAuthenticated, (req, res, next)=>{
    let predavacId = req.user.predavac_id;
    let rez;
    let id = req.params.idPredavanja;
    console.info("usao u post" + predavacId);
    pool.query(
        `select * from predavanja where predavanje_id = $1;`,
        [id], (err, results)=>{
            if(err){
                throw err;
            }
            rez = results.rows;

            if(req.body.mailAdresa){


                const nodemailer = require('nodemailer');

                const transporter = nodemailer.createTransport({
                    service: 'hotmail',
                    auth: {
                        user: 'kerim_node@outlook.com',
                        pass: 'kerim123'

                    }
                });

                const options ={
                    from: 'kerim_node@outlook.com',
                    to: req.body.mailAdresa,
                    subject: 'Kod za predavanje',
                    text: rez[0].kod_predavanja
                }


                transporter.sendMail(options, (err, info) =>{
                    if(err){
                        throw err;
                    }
                    console.info('Sent: ' + info.response)
                });
            }
            console.log(rez.rows);
            res.render('kod', {p:rez});
        }


    );
    //res.render('kod', {p:rez});
});

router.post('/predavac/dashboard/listaPredavanja/ja', (req, res)=>{
   console.info('ovdje');
});


router.post('/novaPoruka', (req, res)=>{
    let poruka = req.body.text;
    let vrijeme = req.body.time;
    let kod = req.body.kljuc;
    let predavanjeID = req.body.kljuc2;
    console.info(poruka, vrijeme, kod, predavanjeID);
    console.info(moment().toISOString());
    /*pool.query(
        `insert into pitanja(predavanje_id, kod_predavanja, pitanje, time)
        values($1,$2,$3,$4);`,
        [predavanjeID, kod, poruka, vrijeme],
        (err, results)=>{
            if(err){
                throw err
            }
            console.info(results.rows);
        }
    );*/
});

router.post('/obrisiPoruku/:id', (req,res, next)=>{
    let m = moment().toISOString();
    console.info('usao u obrisiPoruku', req.params.id);
    pool.query(
        `update pitanja set deleted_at = $1 where pitanje_id = $2`,
        [m, req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }
            res.redirect('back');

        }

    );
});

router.post('/odgovoriPoruku/:id', (req,res,next)=>{
    let m = moment().toISOString();
    console.info('usao u odgovoriPoruku', req.params.id);

    pool.query(
        `update pitanja set deleted_at = $1 where pitanje_id = $2`,
        [m, req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }
            next();
        }
    );


},(req,res,next)=>{
    pool.query(
        `select pitanje,predavanje_id from pitanja where pitanje_id = $1`,
        [req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }
            req.pitanjee = results.rows;
            next();
        }
    );
},(req,res,next)=>{
    pool.query(
        `insert into odgovorena_pitanja(pitanje, predavanje_id) values($1,$2)`,
        [req.pitanjee[0].pitanje, req.pitanjee[0].predavanje_id],
        (err, results)=>{
            if(err){
                throw err;
            }

        }
    );
});


router.post('/sakrijPoruku/:id' +
    '', (req,res,next)=>{
    let m = moment().toISOString();

    pool.query(
        `update pitanja set deleted_at = $1 where pitanje_id = $2`,
        [m, req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }
            next();
        }
    );


},(req,res,next)=>{
    pool.query(
        `select pitanje,predavanje_id from pitanja where pitanje_id = $1`,
        [req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }
            req.pitanjee = results.rows;
            next();
        }
    );
},(req,res,next)=>{
    pool.query(
        `insert into sakrivena_pitanja(pitanje, predavanje_id) values($1,$2)`,
        [req.pitanjee[0].pitanje, req.pitanjee[0].predavanje_id],
        (err, results)=>{
            if(err){
                throw err;
            }

        }
    );
});




router.post('/obrisiPredavanje', (req,res,next)=>{
    let id = req.body.obrisiPred;

    pool.query(`
        delete from predavanja where predavanje_id = $1;`,[id],
        (err, results)=>{
            if(err) throw err;

            res.redirect('/predavac/dashboard/listaPredavanja');

        }
    );
});

router.post('/urediPredavanje', (req,res,next)=>{
    let id = req.body.urediPred;

    pool.query(`
        select * from predavanja where predavanje_id = $1;`,[id],
        (err, results)=>{
            if(err) throw err;

            res.render('predavac-urediPredavanje', {predavanje: results.rows});

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
    res.redirect('/predavac/dashboard/listaPredavanja');
});


router.post('/mailIzvjestaj/:id/:id2', (req,res,next)=>{

    pool.query(
      `select pitanje from pitanja where predavanje_id=$1 and deleted_at is null`,[req.params.id],
         (err, results)=>{
          if(err) throw err;
          req.pitanja =  results.rows;
          next();
        }

    );

},(req,res,next)=>{
    pool.query(
        `select count(*) as "ukupan_broj_odgovorenih_pitanja" from odgovorena_pitanja where predavanje_id=$1`,[req.params.id],
        (err, results)=>{
            if(err) throw err;
            req.odgovorena = results.rows;

            next();
        }

    );

},(req,res,next)=>{
    pool.query(
        `select sum(likes) as "ukupni_broj_odobravanja" from pitanja where predavanje_id=$1 and deleted_at is null`,[req.params.id],
        (err, results)=>{
            if(err) throw err;
            req.lajkovi = results.rows;
            next();

        }
    );
},(req, res, next)=>{
    pool.query(
        `select count(pitanje) as "ukupan_broj_pitanja" from pitanja where predavanje_id=$1`,
        [req.params.id],(err,results)=>{
            if(err) throw err;
            //console.info(req.pitanja);
            //console.info(req.odgovorena);
            //console.info(req.lajkovi);
            //console.info(results.rows);
            let lista_pitanja = [];
            for(let i=0;i<req.pitanja.length;i++)
                lista_pitanja.push(req.pitanja[i].pitanje)

            let broj_odg = [];
            broj_odg.push(req.odgovorena[0].ukupan_broj_odgovorenih_pitanja);

            let broj_odobravanja = [];
            broj_odobravanja.push(req.lajkovi[0].ukupni_broj_odobravanja);

            let broj_pitanja = [];
            broj_pitanja.push(results.rows[0].ukupan_broj_pitanja);

            console.info(lista_pitanja);
            console.info(broj_odg);
            console.info(broj_odobravanja);
            console.info(broj_pitanja);
            let objekat = {
                lista:lista_pitanja,
                odg: broj_odg
            }
            pool.query(
                `select email from predavac where predavac_id=$1`,
                [req.params.id2],
                (err, results)=>{
                    if(err){
                        throw err;
                    }

               //   console.info(results.rows);
                    let mejl = results.rows[0].email;

                    const nodemailer = require('nodemailer');

                    const transporter = nodemailer.createTransport({
                        service: 'hotmail',
                        auth: {
                            user: 'kerim8232@outlook.com',
                            pass: 'kerim123'

                        }
                    });

                    let x = '<table>';
                    x += `<tr><th>Lista pitanja:</th></tr>`
                    for(let i = 0; i < lista_pitanja.length;i++)
                        x += `<tr>${lista_pitanja[i]}</tr>`

                    x += `<tr><th>Broj odgovorenih pitanja: ${broj_odg[0]}</th></tr>`
                    x += `<tr><th>Broj pitanja: ${broj_pitanja[0]}</th></tr>`
                    x += `<tr><th>Broj lajkova: ${broj_odobravanja[0]}</th></tr>`



                    x += '</table>'
                    console.info(x);



                    const options ={
                        from: 'kerim8232@outlook.com',
                        to: mejl,
                        subject: 'Izvjestaj o predavanju',
                        html:x
                    };




                    transporter.sendMail(options, (err, info) =>{
                        if(err){
                            throw err;
                        }
                        console.info('Sent: ' + info.response)
                    });
                }
            );

        }
    );
});




module.exports = router;
