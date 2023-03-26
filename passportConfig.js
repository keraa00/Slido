const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');
const pg = require("pg");
const moment = require("moment");
var config = require('./dbConfig');
/*
var config = {
    user: "rizufwwl",
    database: "rizufwwl",
    password: "P51owCUrizZvtmyVHcPu8SmhJrL1APYX",
    host:"surus.db.elephantsql.com",
    port: 5432,
    max: 100,
    idleTimeoutMillis: 30000
};*/

var pool = new pg.Pool(config);

function initialize(passport){
    const authenticateUser = (email, password, done) => {
        pool.query(
            `select * from predavac where email = $1`,[email], (err, results) =>{
                if(err){
                    throw err;
                }

                console.info(results.rows);

                if(results.rows.length > 0){
                    const user = results.rows[0];

                    bcrypt.compare(password, user.password, (err, isMatch) =>{
                        let blokiran = user.blokiran;
                        let datum = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

                        if(err) {
                            throw err;
                        }
                        //prvi error, drugi korisnik
                        if(isMatch) {
                            if(blokiran == null) {
                                return done(null, user);
                            }
                            if(blokiran !== null) {
                                let isAft = moment(datum).isAfter(blokiran);
                                if(isAft) {
                                    return done(null, user);
                                }
                                else {
                                    return done(null, false, {poruka: "Korisnik je blokiran"});
                                }
                            }
                        }else {
                            return done(null, false, {poruka: "Password nije tacan"});
                        }

                    });
                }else{
                    return done(null, false, {message: "Email nije registrovan."})
                }
            }
        )
    }
    passport.use('passportPredavac', new LocalStrategy({
        usernameField: "email",
        passwordField: "password"
    },authenticateUser)
    );

    passport.serializeUser((user, done)=> done(null, user.predavac_id));

    passport.deserializeUser((id, done)=>{
        pool.query(
            `select * from predavac where predavac_id = $1`, [id], (err, results)=>{
                if(err){
                    throw err;
                }
                return done(null, results.rows[0]);
            }
        );
    });
}

module.exports = initialize;