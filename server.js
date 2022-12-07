const express = require('express')
const app = express()
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient
require('dotenv').config();
app.set('view engine', 'ejs')
const crypto = require('crypto');
let db;
const methodOverride = require('method-override')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const createHashedPassword = (password) => {
    return crypto.createHash("sha512").update(password).digest("base64");
};
app.use(session({ secret: 'anything' }));
app.use(passport.initialize());
app.use(passport.session());
var bkfd2Password = require('pbkdf2-password');
var hasher = bkfd2Password();
app.use(express.json());
var cors = require('cors')
app.use(cors());
// 암호화
app.use(session({secret: '비밀코드', resave: true, saveUninitialized: false}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'))
MongoClient.connect(process.env.mongo_address, function (에러, client) {

    if (에러) return console.log(에러)//에러처리

    db = client.db('todoapp');   ////tododapp이라는 데이터베이스에 연결


    // db.collection('post').insertOne({이름: '심우혁', 나이: 23, _id: 77}, function (에러, 결과) {
    //     console.log('저장완료');
    // });

    app.listen(8080, function () {
        console.log('listening on 8080')
    });
});

// app.post('/add', function (요청, 응답) {
//     db.collection('counter').findOne({name: '게시물갯수'}, function (에러, 결과) {
//         var 총게시물갯수 = 결과.totalPost;
//         db.collection('post').insertOne({_id: (총게시물갯수 + 1), 제목: 요청.body.title, 날짜: 요청.body.date}, function () {
//             console.log('저장완료')
//             응답.send('전송완료')
//         })
//     })
//
// app.post('/add', function (요청, 응답) {
//     응답.send('전송완료')
//     db.collection('post').insertOne({제목: 요청.body.title, 날짜: 요청.body.date}, function () {
//         console.log('저장완료')
//     })
// })
app.post('/add', function (요청, 응답) {
    db.collection('counter').findOne({name: '게시물갯수'}, function (에러, 결과) {
        var 총게시물갯수 = 결과.totalPost

        db.collection('post').insertOne({_id: 총게시물갯수 + 1, 제목: 요청.body.title, 날짜: 요청.body.date}, function (에러, 결과) {
            db.collection('counter').updateOne({name: '게시물갯수'}, {$inc: {totalPost: 1}}, function (에러, 결과) {
                if (에러) {
                    return console.log(에러)
                }
                응답.send('전송완료');
            })
        })

    })
})

app.get('/write', function (요청, 응답) {
    응답.sendFile(__dirname + '/write.html')
})


app.get('/list', function (요청, 응답) {


    db.collection('post').find().toArray(function (에러, 결과) {
        console.log(결과);
        응답.render('list.ejs', {posts: 결과});
    });///모든 데이터 가져오기 문법


})


app.delete('/delete', function (요청, 응답) {
    요청.body._id = parseInt(요청.body._id)
    db.collection('post').deleteOne(요청.body, function (에러, 결과) {
            console.log('삭제완료')
            응답.redirect('/list')
        }
    );
    db.collection('counter').updateOne({name: '게시물갯수'}, {$set: {totalPost: 0}}), function (요청, 응답) {
        console.log("카운트 초기화 완료")
    }, function (에러, 응답) {
        if (에러) {
            return console.log(에러)
        }
    }
})

app.get('/detail/:id', function (요청, 응답) {
    db.collection('post').findOne({
        function(에러, 결과) {
            응답.render('detail.ejs', {posts: 결과})
        }
    })
})

app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function (에러, 결과) {
        res.render('edit.ejs', {edit: 결과})
    })
})

app.put('/edit', function (요청, 응답) {
    db.collection('post').updateOne({_id: parseInt(요청.body.id)}, {
        $set: {
            제목: 요청.body.title,
            날짜: 요청.body.date
        }
    }, function () {

        console.log('수정완료')
        응답.redirect('/list')

    });
});
app.get('/home', function (req, res) {
    db.collection('counter').findOne(function (error, result) {
        res.render('home.ejs', {data: result,user:req.user})
    })
})

app.get('/login', function (req, res) {
    res.render('login.ejs')
})
app.post('/login', passport.authenticate('local', {failureRedirect: '/fail'}), function (req, res) {
    res.redirect('/home')
});

app.get('/mypage', isLogin, function (req, res) {
    res.render('mypage.ejs', {user: req.user})
})
app.get('/fail',function (req, res){
    res.render('fail')
})

function isLogin(req, res, next) {
    console.log("req.user= "+req.user)
    if (req.user) {
        next()
    } else {
        res.send('로그인안하셨는데요?')
    }

}
module.exports = app;

app.get("/logout", function (req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/home");
    });
});
// app.get('/logout', function (req, res, next) {
//     req.logout(function(err) {
//         if (err) { return next(err); }
//         res.session.destroy();
//         res.render('home.ejs');
//     req.logout();
//     res.redirect('/home');
// });
app.get('/join', function (req, res) {
    res.render('join.ejs')
})
app.post('/join', function (req, res) {
    // const hashId = crypto.createHash('sha512').update(req.body.id + salt).digest('hex');
    // const hashPw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex');
    // let cryptedId=createHashedPassword(req.body.id)
    hasher({
        password: req.body.pw
    }, (err, pass, salt, hash) => {
        db.collection('login').insertOne({id: req.body.id, pw: hash,salt:salt})
    })
    // res.send('complete')
    res.render('logincomplete.ejs')

})


passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
}, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({id: 입력한아이디}, function (에러, 결과) {
        console.log(결과)
        if (에러) return done(에러)
        if (!결과) return done(null, false, {message: '존재하지않는 아이디요'})


        hasher({ password: 입력한비번, salt: 결과.salt }, (err, pass, salt, hash) => {
            if(결과.pw === hash){
                console.log("같은 패스워드")
               return done(null,결과)
            }
            else{
                console.log("다른 패스워드")
                console.log('hash: '+hash)
                console.log('결과.hash:' +결과.pw)
                console.log("입력한비번: "+입력한비번)
               return done(null,false,{message:'비번 틀림'})
            }
        });
            // if (입력한비번 == 결과.pw) {
            //     return done(null, 결과)
            // } else {
            //     return done(null, false, {message: '비번틀렸어요'})
            // }
        })


}));

passport.serializeUser(function (user, done) {
    done(null, user.id)
});

passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({id: 아이디}, function (에러, 결과) {
        done(null, 결과)
    })
});