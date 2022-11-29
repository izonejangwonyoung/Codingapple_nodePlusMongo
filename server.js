const express = require('express')
const app = express()
app.use(express.urlencoded({extended: true}));
const MongoClient = require('mongodb').MongoClient
require('dotenv').config();
app.set('view engine', 'ejs')
let db;
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

app.post('/add', function (요청, 응답) {
    응답.send('전송완료')
    db.collection('post').insertOne({제목: 요청.body.title, 날짜: 요청.body.date}, function () {
        console.log('저장완료')
    })
})

app.get('/write', function (요청, 응답) {
    응답.sendFile(__dirname + '/write.html')
})


app.get('/list', function (요청, 응답) {


    db.collection('post').find().toArray(function (에러, 결과) {
        console.log(결과);
        응답.render('list.ejs',{posts: 결과});
    });///모든 데이터 가져오기 문법

})