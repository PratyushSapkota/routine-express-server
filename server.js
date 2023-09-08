import express from 'express';
import cors from 'cors';
import { yala, decoder, lobuche } from './data.js';
import bcrypt from 'bcrypt';
const app = express();
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();
app.use(cors());
app.use(express.json())

const connect =async () =>{
    const Mongo_client = new MongoClient(process.env.MONGODB_URL);
    db = (await Mongo_client.connect()).db("Routine");
}
let db 

connect().then(() => {
    app.listen(5003, async () => {
        console.log("Server Started on http://localhost:" + 5003);
    })
})

app.get('/api/yala', async (req, res) => {
    const RawData_Yala = await db.collection('Yala').find({}).toArray();

    let data = {
        "ids_yala": [],
        "yala": yala,
        "decoder": decoder
    }

    if (RawData_Yala.length != 0) {
        for (let i = 0; i < RawData_Yala.length; i++) {
            data.ids_yala.push(RawData_Yala[i]['teacher']);
        }
    }

    res.send(data);

})

app.get('/api/lobuche', async (req, res) => {

    const RawData_Lobuche = await db.collection('Lobuche').find({}).toArray();

    let data = {
        "ids_lobuche": [],
        "lobuche": lobuche,
        "decoder": decoder
    }

    if (RawData_Lobuche.length != 0) {
        for (let i = 0; i < RawData_Lobuche.length; i++) {
            data.ids_lobuche.push(RawData_Lobuche[i]['teacher']);
        }
    }

    res.send(data);


})

app.post('/server/expirecheck', async () => {
    //yala
    const NumToDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let date = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
    const resYala = await db.collection('Yala').find({}).toArray();
    if (resYala.length != 0) {

        let yalaIds = []
        let yalaDate = []
        for (let i = 0; i < resYala.length; i++) {
            yalaIds.push(resYala[i]['teacher'])
            yalaDate.push(resYala[i]['date'])
        }

        for (let i = 0; i < yalaIds.length; i++) {
            if (((yala[NumToDays[new Date().getDay()]]).includes(yalaIds[i])) && date != yalaDate[i]) {
                db.collection('Yala').deleteOne({ 'teacher': `${yalaIds[i]}` })
            }
        }
    }

    //lobuche
    const resLobuche = await db.collection('Lobuche').find({}).toArray();
    if (resLobuche.length != 0) {
        let lobucheIds = []
        let lobucheDate = []
        for (let i = 0; i < resLobuche.length; i++) {
            lobucheIds.push(resLobuche[i]['teacher'])
            lobucheDate.push(resLobuche[i]['date'])
        }

        for (let i = 0; i < lobucheIds.length; i++) {
            if (((lobuche[NumToDays[new Date().getDay()]]).includes(lobucheIds[i])) && date != lobucheDate[i]) {
                db.collection('Lobuche').deleteOne({ 'teacher': `${lobucheIds[i]}` })
            }
        }
    }
})

app.post('/api/insert', async (req, res) => {
    let postData = req.body
    let coll, count

    let teacher = postData.teacher
    let section = postData.section

    if (section == 'yala') {
        coll = db.collection('Yala')
        count = await coll.find({ 'teacher': `${teacher}` }).toArray()
    } else {
        coll = db.collection('Lobuche')
        count = await coll.find({ 'teacher': `${teacher}` }).toArray()

    }

    if (count.length != 0) {
        //delete 
        await coll.deleteOne({
            'teacher': `${teacher}`
        })
    } else {
        //add
        await coll.insertOne({
            'teacher': `${teacher}`,
            'date': `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`
        })
    }
    res.sendStatus(200)
})


app.post('/auth/users', async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    const result = await db.collection('Users').findOne({ 'username': `${username}` })

    if (result != null) {
        bcrypt.compare(password, result['password'], (e, r) => {
            if (r) {
                res.json({ 'logged': true, 'section': result['section']})
            } else {
                res.json({ 'logged': false, 'section': NaN})
            }
            
        })
        
    } else {
        res.json({ 'logged': false, 'section': NaN})
    }
})
