const express = require('express')
const app = express()
app.use(express.static("views"));
const MongoClient = require('mongodb').MongoClient
const crypto = require('crypto');
const methodOverride = require('method-override')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const fs=require('fs')
app.set('trust proxy', true)
require('dotenv').config()

const createHashedPassword = (password) => {
    return crypto.createHash("sha512").update(password).digest("base64");
};
var bkfd2Password = require('pbkdf2-password');
var hasher = bkfd2Password();
var cors = require('cors')
const bodyParser = require("express");
const {ObjectId} = require("mongodb");
// const {request} = require("express");
const request = require("request")
const https = require("https");
const http = require("http");
const key = process.env.TMDB_API_KEY
const addr = "https://api.themoviedb.org/3/movie/now_playing?api_key="
const addr2 = "&language="
const addr3 = "ko-KR"
const logStream = fs.createWriteStream('./access.log', { flags: 'a' });

var myaddr = addr + key + addr2 + addr3
let db;
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extends: true}))
app.use(express.urlencoded({extended: true}));
app.use(express.json());
require('dotenv').config();
app.set('view engine', 'ejs')
app.use(session({secret: 'anything'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());
// 암호화
app.use(session({secret: '비밀코드', resave: true, saveUninitialized: false}));

module.exports = app;
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'))
app.use((req, res, next) => {
    const forbiddenFileExtensions = ['.js', '.css', '.html','.env'];
    const requestedUrl = req.url;

    if (forbiddenFileExtensions.some(ext => requestedUrl.endsWith(ext))) {
        return res.status(403).send('Forbidden');
    }

    return next();
});
function getToday() {
    var date = new Date();
    var year = date.getFullYear();
    var month = ("0" + (1 + date.getMonth())).slice(-2);
    var day = ("0" + date.getDate()).slice(-2) - 1;

    return year + month + day;
}
//20230306 로그 기록 함수
function logAccess(req, res) {
     const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
    // // const ip = req.headers['x-real-ip']  ||
    //  const ip = req.headers['x-real-ip']||
    //      // req.connection.remoteAddress
    //      // req.socket.remoteAddress
    //      req.connection.socket.remoteAddress;
    const time = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const statusCode = res.statusCode;

    // 로그 메시지 작성
    const logMessage = `${ip} - [${time}] "${method} ${url}" ${statusCode}\n`;

    // 로그 파일에 쓰기
    logStream.write(logMessage);
}

MongoClient.connect(process.env.MONGO_ADDRESS, function (에러, client) {

    if (에러) return console.log(에러)//에러처리

    db = client.db('todoapp');   ////tododapp이라는 데이터베이스에 연결
    console.log(db)

    // db.collection('post').insertOne({이름: '심우혁', 나이: 23, _id: 77}, function (에러, 결과) {
    //     console.log('저장완료');
    // });

    app.listen(80, function () {
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


app.get('/', function(req, res){
    logAccess(req, res);

    res.send('빈 페이지입니다. <a href="/login">로그인 페이지</a>로 가기');
});
app.post('/addcomplete', function (요청, 응답) {
    logAccess(요청, 응답);
    db.collection('counter').findOne({name: '게시물갯수'}, function (에러, 결과) {
        var 총게시물갯수 = 결과.totalPost

        db.collection('post').insertOne({
            _id: 총게시물갯수 + 1,
            작성자: 요청.user._id,
            제목: 요청.body.title,
            내용: 요청.body.date,
            날짜: new Date(),
            닉네임: 요청.user.nickname
        }, function (에러, 결과) {
            db.collection('counter').updateOne({name: '게시물갯수'}, {$inc: {totalPost: 1}}, function (에러, 결과) {
                if (에러) {
                    return console.log(에러)
                }
                응답.render('addcomplete.ejs',{user:요청.user});
            })
        })

    })
})
app.get('/movietest', function (req, res, next) {
    logAccess(req, res);

    request(myaddr, function (error, response, body) {
        console.log(myaddr)
        if (error) {
            console.log(error)
        }
        var obj = JSON.parse(body)
        console.log(obj.results[0].title) // 콘솔창에 찍어보기
        res.render('movietest.ejs', {obj: obj, user: req.user})
    })
})
// app.get('/moviesearch', isLogin,function(req, res, next){
//     request(myaddr, function(error, response, body){
//         if(error){
//             console.log(error)
//         }
//         var obj = JSON.parse(body)
//         console.log(obj.boxOfficeResult.dailyBoxOfficeList[1].movieNm) // 콘솔창에 찍어보기
//         res.render('moviesearch.ejs',{obj:obj.boxOfficeResult,user:req.user})
//     })
// })
app.get('/admin', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('login').find().toArray(function (err, result) {
        console.log(result)
        res.render('admin.ejs', {user: req.user, post: result})
    })
})
app.delete('/deleteaccount', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('login').deleteOne({pw: req.body.pw}, function (err, result) {
        console.log(result)
        console.log('delete account complete')
    })
    res.send('account delete complete')
})
app.put('/updateloginallowed', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('login').updateOne({pw: req.body.pw}, {$set: {isallowed: "Y"}}, function (err, result) {
        if (err) {
            return console.log(err)
        }
        console.log(result)
        console.log('로그인허가완료되었습니다')
    })
    res.send('로그인허가완료되었습니다.')
})
app.put('/updatelogindenied', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('login').updateOne({pw: req.body.pw}, {$set: {isallowed: "N"}}, function (err, result) {
        if (err) {
            return console.log(err)
        }
        console.log(result)
        console.log('로그인비허가완료되었습니다')
    })
    res.send('로그인비허가완료되었습니다.')
})
app.put('/giveadminauth', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('login').updateOne({pw: req.body.pw}, {$set: {role: "admin"}}, function (err, result) {
        if (err) {
            return console.log(err)
        }
        console.log(result)
        console.log('관리자 권한 부여 완료되었습니다')
    })
    res.send('관리자 권한 부여 완료되었습니다')
})
app.put('/giveuserauth', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('login').updateOne({pw: req.body.pw}, {$set: {role: "user"}}, function (err, result) {
        if (err) {
            return console.log(err)
        }
        console.log(result)
        console.log('유저 권한 부여 완료되었습니다')
    })
    res.send('유저 권한 부여 완료되었습니다')
})
app.get('/deleteallcomment', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('post').deleteMany({}, function (err, result) {
        db.collection('counter').updateOne({name: '게시물갯수'}, {$set: {totalPost: 0}}, function (err, result) {

            if (err) {
                return console.log(err)
            }
            res.send('게시글 전체 삭제 완료')
        })
    })
})
////20230223 관리자 페이지 카운터 0으로 초기화 버튼 기능 구현
app.get('/resetcounter', isAdmin, function (req, res) {
    logAccess(req, res);

    db.collection('counter').updateOne({name: '게시물갯수'}, {$set: {totalPost: 0}}, function (err, result) {

        if (err) {
            return console.log(err)
        }
        res.send('게시글 카운트 초기화 완료')
    })
})
app.get('/write', isLogin, function (req, res) {
    logAccess(req, res);

    res.render('write.ejs', {user: req.user})
})


app.get('/list', isLogin, function (요청, 응답) {
    logAccess(요청, 응답);
    db.collection('counter').findOne({name: '게시물갯수'}, function (에러, 결과) {

        db.collection('post').find().toArray(function (err, result) {
            console.log(result);
            응답.render('list.ejs', {posts: result, user: 요청.user, count: 결과});
        });///모든 데이터 가져오기 문법

    })
})


app.delete('/delete', function (요청, 응답) {
    logAccess(요청, 응답);

    요청.body._id = parseInt(요청.body._id);

        db.collection('post').findOne({_id: 요청.body._id}, function (err, result) {

                //     console.log(result.작성자,'result.작성자')
                //     console.log(요청.user._id,'<=요청.user._id')
                //     console.log(typeof result.작성자)
                // console.log(typeof 요청.user._id)
                const myobjectid1 = ObjectId(result.작성자)
                const myobjectid2 = ObjectId(요청.user._id)
                const myobject1string = myobjectid1.toString()
                const myobject2string = myobjectid2.toString()
                if (요청.user.role === 'admin') {
                    db.collection('post').deleteOne({_id: 요청.body._id}, function (에러, 결과) {
                        // console.log("글 작성한 사람: "+요청.body.작성자)
                        console.log("글 작성한 사람:" + result.작성자)
                        console.log("삭제버튼누른사람:" + 요청.user._id)
                        console.log("삭제id:" + 요청.body._id)
                        console.log("관리자 권한")
                        console.log("삭제완료")

                    })
                    db.collection('counter').updateOne({name: '게시물갯수'}, {$inc: {totalPost: -1}}, function (요청, 응답) {
                        console.log("카운트 초기화 완료")
                    }, function (에러, 응답) {
                        if (에러) {
                            return console.log(에러)
                        }
                    })
                    console.log("관리자 권한")
                    console.log("삭제완료")


                }
                // db.collection('post').deleteOne({_id: 요청.body._id, 작성자: 요청.user._id}, function (에러, 결과) {
                //         // console.log("글 작성한 사람: "+요청.body.작성자)
                //         console.log("글 작성한 사람: " + result.작성자)
                //         console.log("삭제버튼누른사람:" + 요청.user._id)
                //         console.log("삭제id:" + 요청.body._id)

                if (myobject1string == myobject2string) {
                    db.collection('post').deleteOne({_id: 요청.body._id}, function (에러, 결과) {
                        // console.log("글 작성한 사람: "+요청.body.작성자)
                        console.log("글 작성한 사람:" + result.작성자)
                        console.log("삭제버튼누른사람:" + 요청.user._id)
                        console.log("삭제id:" + 요청.body._id)
                    })
                    db.collection('counter').updateOne({name: '게시물갯수'}, {$inc: {totalPost: -1}}, function (요청, 응답) {
                        console.log("카운트 초기화 완료")
                    }, function (에러, 응답) {
                        if (에러) {
                            return console.log(에러)
                        }
                    })
                    console.log("글 주인")
                    console.log("삭제완료")
                } else {
                    // console.log(typeof(result.작성자))
                    console.log('글주인X')
                    console.log('삭제불가')
                    console.log("글 작성한 사람: " + 요청.body)
                    console.log(JSON.stringify(요청.body));
                    console.log("---------")
                    console.log(JSON.stringify(요청.user));
                    console.log("---------")
                    console.log(result._id)
                    console.log(result.작성자)

                    console.log("삭제버튼누른사람:" + 요청.user._id)
                    console.log("삭제id:" + 요청.body._id)
                }
            }
        );
        // db.collection('counter').updateOne({name: '게시물갯수'}, {$inc: {totalPost: -1}}, function (요청, 응답) {
        //     console.log("카운트 초기화 완료")
        // }, function (에러, 응답) {
        //     if (에러) {
        //         return console.log(에러)
        //     })
    }
)

app.get('/detail/:id', function (요청, 응답) {
    logAccess(요청, 응답);
    db.collection('post').findOne({
        function(에러, 결과) {
            응답.render('detail.ejs', {posts: 결과})
        }
    })
})

app.get('/edit/:id', function (req, res) {
    logAccess(req, res);
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function (에러, 결과) {
        res.render('edit.ejs', {edit: 결과})
    })
})

app.put('/edit', isLogin, function (요청, 응답) {
    logAccess(요청, 응답);
    db.collection('post').updateOne({_id: parseInt(요청.body.id)}, {
        $set: {
            제목: 요청.body.title,
            내용: 요청.body.date
        }
    }, function () {

        console.log('수정완료')
        응답.redirect('/list')

    });
});

app.post('/chat', function (req, res) {
    logAccess(req, res);
    var 저장할거 = {
        title: req.user.id + '가 생성한 채팅방',
        member: [ObjectId(req.body.대상id), req.user._id],
        date: new Date()
    }

    db.collection('chatroom').insertOne(저장할거).then(function (결과) {
        res.send('저장완료')
    });
});
app.get('/chat', isLogin, function (req, res) {
    logAccess(req, res);
    db.collection('chatroom').find({member: req.user._id}).toArray().then((결과) => {
        console.log(결과);
        ///결과가 어레이 형식으로 들어옴
        console.log(결과[0].date);
        res.render('chat.ejs', {data: 결과, user: req.user})
    })
})

app.post('/message', isLogin, function (요청, 응답) {
    logAccess(요청, 응답);
    var 저장할거 = {
        parent: 요청.body.parent,
        userid: 요청.user._id,
        content: 요청.body.content,
        date: new Date(),
    }
    db.collection('message').insertOne(저장할거)
        .then((결과) => {
            응답.send(결과);
        })
});


app.get('/message/:parentid', isLogin, function (요청, 응답) {
    logAccess(요청, 응답);
    응답.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
    });

    db.collection('message').find({parent: 요청.params.parentid}).toArray()
        .then((결과) => {
            console.log(결과);
            응답.write('event: test\n');
            응답.write(`data: ${JSON.stringify(결과)}\n\n`);
        });
    const 찾을문서 = [
        {$match: {'fullDocument.parent': 요청.params.parentid}}
    ];

    const changeStream = db.collection('message').watch(찾을문서);
    changeStream.on('change', result => {
        console.log(result.fullDocument);
        var 추가된문서 = [result.fullDocument];
        응답.write(`data: ${JSON.stringify(추가된문서)}\n\n`);
    });
});


app.get('/home', isLogin, function (req, res) {
    logAccess(req, res);
    db.collection('counter').findOne(function (error, result) {
        res.render('home.ejs', {data: result, user: req.user})
    })
})
app.get('/welcome', function (req, res) {
    logAccess(req, res);

    res.render('welcome.ejs')
})
app.get('/login', function (req, res) {
    logAccess(req, res);

    res.render('login.ejs', {user: req.user})
})
app.post('/login', passport.authenticate('local', {failureRedirect: '/fail'}), function (req, res) {
    logAccess(req, res);

    res.redirect('/home')
});

app.get('/mypage', isLogin, function (req, res) {
    logAccess(req, res);

    res.render('mypage.ejs', {user: req.user})
})
app.get('/fail', function (req, res) {
    logAccess(req, res);

    const {headers: {referer}} = req
    console.log(referer);
    if (referer !== 'http://footprint.ericshim.me/login') {
        res.render('caution.ejs')
    } else {
        res.render('fail.ejs', {user: req.body})
    }
})
app.get('/search', (req, res) => {
    logAccess(req, res);

    console.log(req.query.value)
    var 검색조건 = [
        {
            $search: {
                index: 'default',
                text: {
                    query: req.query.value,
                    path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
                }
            }
        }
    ]
    console.log("req.query=" + req.query)
    db.collection('post').aggregate(검색조건).toArray((err, result) => {
        console.log("result=" + result)
        res.render('search.ejs', {result: result, user: req.user})
    })

})


function isLogin(req, res, next) {
    console.log("req.user= " + req.user)
    console.log("req.user= " + JSON.stringify(req.user))

    if (req.user && req.user.isallowed === "Y") {
        next()
    } else {
        res.redirect('login')
    }

}

function isAdmin(req, res, next) {
    console.log("req.user= " + JSON.stringify(req.user))

    if (req.user.role === 'admin') {
        next()
    } else {
        res.redirect('login')
    }

}

app.get("/logout", function (req, res, next) {
    logAccess(req, res);

    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/login");
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
    logAccess(req, res);

    res.render('join.ejs', {user: req.user})
})
app.post('/join', function (req, res) {
    logAccess(req, res);

    // const hashId = crypto.createHash('sha512').update(req.body.id + salt).digest('hex');
    // const hashPw = crypto.createHash('sha512').update(req.body.pw + salt).digest('hex');
    // let cryptedId=createHashedPassword(req.body.id)
    hasher({
        password: req.body.pw
    }, (err, pass, salt, hash) => {
        db.collection('login').insertOne({
            id: req.body.id,
            pw: hash,
            salt: salt,
            nickname: req.body.nickname,
            role: "user",
            isallowed: "N"
        })
    })
    // res.send('complete')
    res.render('joincomplete.ejs', {user: req.user})

})


passport.use(new LocalStrategy({
    usernameField: 'id',
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


        hasher({password: 입력한비번, salt: 결과.salt}, (err, pass, salt, hash) => {
            if (결과.pw === hash) {
                console.log("같은 패스워드")
                return done(null, 결과)
            } else {
                console.log("다른 패스워드")
                console.log('hash: ' + hash)
                console.log('결과.hash:' + 결과.pw)
                console.log("입력한비번: " + 입력한비번)
                return done(null, false, {message: '비번 틀림'})
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