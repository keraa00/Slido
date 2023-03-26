var express = require('express');
const pg = require("pg");
var router = express.Router();
var moment = require('moment');
var config = require('../dbConfig');
const nodemailer = require("nodemailer");

var pool = new pg.Pool(config);


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('chat-ulaz');

});

router.get('/chat' , (req, res, next) =>{
  res.render('chat-publika');
});



router.post('/chat' , (req, res, next) => {
    let kod = req.body.room;
    console.info('kod je ', kod);
    console.info(req.body);
    let kod2 = req.body.kera;


    if(req.body.sort == 1){
        pool.query(
            `select * from predavanja where kod_predavanja = $1`,
            [kod2],
            async (err, results) => {
                if (err) {
                    throw err;
                }
                let predavanja1 = await results.rows;
                pool.query(
                    `select * from pitanja where kod_predavanja=$1 and deleted_at is null order by pitanje_id asc`,
                    [kod2], async(err, results)=>{
                        if(err){
                            throw err;
                        }
                        let pitanja1 = await results.rows;
                        pool.query(`
                            select * from zabranjene_rijeci`,[],async (err,results)=>{
                                if(err) throw err;
                                let zab = results.rows;
                                return res.render('chat-publika', {p:predavanja1, pitanja:pitanja1, zabranjena: zab});

                            }
                        );
                        //res.render('chat-publika', {p:predavanja1, pitanja:pitanja1});

                    }
                );
            });

    }

     if(req.body.sort == 2){
        pool.query(
            `select * from predavanja where kod_predavanja = $1`,
            [kod2],
            async (err, results) => {
                if (err) {
                    throw err;
                }
               let predavanja2 = await results.rows;
                pool.query(
                    `select * from pitanja where kod_predavanja=$1 and deleted_at is null order by pitanje_id desc`,
                    [kod2], async(err, results)=>{
                        if(err){
                            throw err;
                        }
                        let pitanja2 = await results.rows;
                        pool.query(`
                            select * from zabranjene_rijeci`,[],async (err,results)=>{
                                if(err) throw err;
                                let zab = results.rows;
                               return res.render('chat-publika', {p:predavanja2, pitanja:pitanja2, zabranjena: zab});

                            }
                        );
                        //res.render('chat-publika', {p:predavanja2, pitanja: pitanja2});

                    }
                );
            });

    }
     if(req.body.sort == 3){
        pool.query(
            `select * from predavanja where kod_predavanja = $1`,
            [kod2],
            async (err, results) => {
                if (err) {
                    throw err;
                }
               // req.predavanja3 = await results.rows;
                let predavanja3 = await results.rows;
                console.info(req.predavanja);

                pool.query(
                    `select * from pitanja where kod_predavanja=$1 and deleted_at is null order by likes desc;`,
                    [kod2], async (err, results)=>{
                        if(err){
                            throw err;
                        }
                        let pitanja3 = await results.rows;
                        pool.query(`
                            select * from zabranjene_rijeci`,[],async (err,results)=>{
                                if(err) throw err;
                                let zab = results.rows;
                                return res.render('chat-publika', {p:predavanja3, pitanja:pitanja3, zabranjena: zab});

                            }
                        );
                       // res.render('chat-publika', {p:predavanja3, pitanja:pitanja3});

                    }
                );

            });

    }




    pool.query(
        `select * from pitanja where kod_predavanja = $1 and deleted_at is null order by pitanje_id`,
        [kod],
         async (err, results)=>{
            if(err){
                throw err;
            }

             let pitanja = await results.rows;
             let kod = req.body.room;
             pool.query(
                 `select * from predavanja where kod_predavanja = $1`,
                 [kod],
                 async (err, results) => {
                     if (err) {
                         throw err;
                     }
                     let predavanja = await results.rows;
                     pool.query(`
                            select * from zabranjene_rijeci`,[],async (err,results)=>{
                             if(err) throw err;
                             let zab = results.rows;
                             return res.render('chat-publika', {p:predavanja, pitanja:pitanja, zabranjena: zab});

                         }
                     );
                 });
        }
    );

});



router.post('/novaPoruka', (req, res)=>{
    let poruka = req.body.text;
    let vrijeme = req.body.time;
    let kod = req.body.kljuc;
    let predavanjeID = req.body.kljuc2;


    pool.query(
        `insert into pitanja(predavanje_id, kod_predavanja, pitanje, time)
        values($1,$2,$3,$4);`,
        [predavanjeID, kod, poruka, vrijeme],
        (err, results)=>{
            if(err){
                throw err
            }
            //console.info(results.rows);
        }
    );
});

router.post('/lajk/:id', (req,res,next)=>{
    console.info("lajk:" ,req.params.id);
    pool.query(
        `update pitanja set likes = likes + 1 where pitanje_id=$1`,
        [req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }

        }
    );

});

router.post('/unlajk/:id', (req,res,next)=>{
    console.info("unlajk:" ,req.params.id);
    pool.query(
        `update pitanja set likes = likes - 1 where pitanje_id=$1`,
        [req.params.id],
        (err, results)=>{
            if(err){
                throw err;
            }

        }
    );
});

router.post('/rating/:kodPred', (req, res, next) =>{
   // odradi upit pronadji predavac_id za ovaj kod i onda mail predavaca tog ida
    console.info('ovdje')
    pool.query(
        `select predavac_id from predavanja where kod_predavanja=$1`,
        [req.params.kodPred],
        (err, results)=>{
            if(err){
                throw err;
            }
            req.predavacID = results.rows;
            console.info(req.predavacID);
            next();
        }
    );
},(req, res, next)=>{
    let a = req.body.kljuc;
    let b = req.body.tekst;
    console.info(a,b);
    pool.query(
        `select email from predavac where predavac_id=$1`,
        [req.predavacID[0].predavac_id],
        (err, results)=>{
            if(err){
                throw err;
            }

            console.info(results.rows);

            req.email = results.rows;
            console.info(req.email[0].email);
                const nodemailer = require('nodemailer');
            const mejl = req.email[0].email;

            const transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: 'kerim8232@outlook.com',
                    pass: 'kerim123'

                }
            });

            const options ={
                from: 'kerim8232@outlook.com',
                to: mejl,
                subject: a,
                text: b
            }


            transporter.sendMail(options, (err, info) =>{
                if(err){
                    throw err;
                }
                console.info('Sent: ' + info.response)
            });
        }
    );
});




router.post('/sakrijPoruku/:poruka/:id', (req,res,next)=> {
    pool.query(
        `insert into sakrivena_pitanja(pitanje, predavanje_id) values($1, $2)`, [req.params.poruka, req.params.id],
        (err, results) => {
            if (err) {
                throw err;
            }

        }
    );
});

module.exports = router;
