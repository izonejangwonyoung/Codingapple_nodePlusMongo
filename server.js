const express = require('express')
const app = express()
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient
require('dotenv').config();
app.set('view engine', 'ejs')
let db;
const methodOverride=require('method-override')
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
    });
    db.collection('counter').updateOne({name: '게시물갯수'}, {$set: {totalPost: 0}}), function (요청, 응답) {
        console.log("카운트 초기화 완료")
    }, function (에러, 응답) {
        if (에러) {
            return console.log(에러)
        }
        응답.send('전체삭제완료')
    }
})

app.get('/detail/:id', function (요청, 응답) {
    db.collection('post').findOne({_id: parseInt(요청.params.id)}, function (에러, 결과) {
        응답.render('detail.ejs', {posts: 결과})
    })
});

app.get('/edit/:id', function (req, res) {
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function (에러, 결과) {
        res.render('edit.ejs', {edit: 결과})
    })
})

app.put('/edit', function(요청, 응답){
    db.collection('post').updateOne( {_id : parseInt(요청.body.id) }, {$set : { 제목 : 요청.body.title , 날짜 : 요청.body.date }}, function(){

        console.log('수정완료')
        응답.redirect('/list')

    });
});