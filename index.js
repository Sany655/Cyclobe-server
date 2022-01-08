const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config()
const { MongoClient } = require('mongodb')
const ObjectId = require('mongodb').ObjectId

const app = express()

// middlewares
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('niche website');
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e2cer.mongodb.net/${process.env.DB}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        console.log('mongodb connected');
        const db = client.db(process.env.DB);

        // users api here
        const users = db.collection('users');

        // users api here

        // admin checkup for private admin route
        app.get('/users/:email', async (req, res) => {
            const result = await users.findOne({ email: req.params.email })
            const response = result?.role === 'admin' ? true : false;
            res.send(response);
        })

        // after registration via email/pasword save user to db
        app.post('/users', async (req, res) => {
            const result = await users.insertOne(req.body);
            res.send(result);
        })
        // after registration via google signin save user to db
        app.put('/users', async (req, res) => {
            const result = await users.updateOne({ email: req.body.email }, { $set: req.body }, { upsert: true });
            res.send(result);
        })
        // make admin
        app.put('/make-admin', async (req, res) => {
            const result = await users.updateOne({ email: req.body.email }, { $set: { role: 'admin' } });
            if (result.modifiedCount) {
                res.send(res.send(`${req.body.email} is an admin now`));
            } else {
                res.send(res.send(`Something went wrong`));
            }
        })

        // products api
        const cycle = db.collection('cycle')
        // sending all producst
        app.get('/products', async (req,res)=>{
            const result = await cycle.find().sort({_id:-1}).toArray();
            res.send(result);
        })
        // products/cycles for home page
        app.get('/products/for-home', async (req,res)=>{
            const result = await cycle.find().limit(6).sort({_id:-1}).toArray();
            res.send(result);
        })
        // just one product
        app.get('/products/:id', async (req,res)=>{
            const result = await cycle.findOne({_id:ObjectId(req.params.id)});
            res.send(result);
        })

        app.delete('/products/:id', async (req,res)=>{
            const result = await cycle.deleteOne({_id:ObjectId(req.params.id)});
            res.send(result);
        })

        app.post('/products', async (req, res) => {
            const result = await cycle.insertOne(req.body);
            if (result.insertedId) {
                res.send('Saved successfully');
            }else{
                res.send('Something went wring');
            }
        })

        // orders api here
        const order = db.collection('order');
        // place order
        app.post('/place-order', async (req, res) => {
            req.body.status = 'panding';
            const result = await order.insertOne(req.body);
            if (result.insertedId) {
                res.send('Order Placed Successfully');
            }else{
                res.send('Something went wring');
            }
        })
        // get my orders
        app.get('/my-orders/:userId', async (req, res) => {
            const userId = req.params.userId;
            const result = await order.find({uid:userId}).toArray();
            res.send(result)
        })
        // delete my order
        app.delete('/order/:id', async (req, res) => {
            const result = await order.deleteOne({_id:ObjectId(req.params.id)});
            res.send(result)
        })
        // get all orders
        app.get('/orders', async (req, res) => {
            const result = await order.find({}).sort({_id:-1}).toArray();
            res.send(result)
        })
        // Shift order
        app.put('/order/status-update/:id', async (req, res) => {
            const result = await order.updateOne({_id:ObjectId(req.params.id)},{$set:{status:'shift'}});
            res.send(result)
        })

        // review api here
        const review = db.collection('review');

        app.get('/review', async (req, res) => {
            const result = await review.find().sort({_id:-1}).limit(10).toArray();
            res.send(result)
        })

        app.post('/review', async (req, res) => {
            const result = await review.insertOne(req.body);
            if (result.insertedId) {
                res.send('Review Saved Successfully');
            }else{
                res.send('Something went wring');
            }
        })

    } finally {
        // await client.close()
    }
}

run().catch(console.dir)

app.listen(port, () => {
    console.log('cyclobe - http://localhost:5000');
})