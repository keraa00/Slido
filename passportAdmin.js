const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');
const pg = require("pg");
const moment = require("moment");
var config = require('./dbConfig');


var pool = new pg.Pool(config);

function initialize(passport){
    const authenticateUser = (email, password, done) => {
        pool.query(
            `select * from admin where email = $1`,[email], (err, results) =>{
                if(err){
                    throw err;
                }

                console.info(results.rows);

                if(results.rows.length > 0){
                    const user = results.rows[0];

                    bcrypt.compare(password, user.password, (err, isMatch) =>{
                        if(err){
                            throw err;
                        }
                        if(isMatch){
                            return done(null, user);
                        }else{
                            return done(null, false, {message: "Password nije tacan"});
                        }

                    });
                }else{
                    console.info("ADMIN");
                    return done(null, false, {message: "Email nije registrovan."})
                }
            }
        )
    }
    passport.use('passportAdmin',new LocalStrategy({
            usernameField: "email",
            passwordField: "password"
        },authenticateUser)
    );

    passport.serializeUser((user, done)=> done(null, user.admin_id));

    passport.deserializeUser((id, done)=>{
        pool.query(
            `select * from admin where admin_id = $1`, [id], (err, results)=>{
                if(err){
                    throw err;
                }
                return done(null, results.rows[0]);
            }
        );
    });
}

module.exports = initialize;