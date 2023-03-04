
require('dotenv').config()
const express=require('express')
const mongoose=require("mongoose")
const app=express()
const PORT=process.env.PORT_NO
const bcrypt=require('bcrypt')
const userModel=require("./models/User")
const questionsModel=require("./models/Questions")
const session=require("express-session")
// const { findById } = require('./models/User')
const mongoSession = require("connect-mongodb-session")(session);
const { ObjectId } = require("mongodb");


app.use(express.urlencoded({extended:true}))
app.use(express.json());

mongoose.connect(process.env.DB_CONNECTION_STRING,{
    useUnifiedTopology:true,
    useNewUrlParser:true,
}).then(()=>console.log('db connection successfully established'))
.catch((err)=>console.log(err))

const store = new mongoSession({
	uri: process.env.DB_CONNECTION_STRING,
	collection: "usersessions",
});

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		saveUninitialized: true,
		resave: false,
		cookie: {
			maxAge: 3600 * 1000 * 0.5,
			sameSite: true,
			httpOnly: true,
		},
		store: store,
	})
);

const auth=(req,res,next)=>{
    if(req.session.isValid_req){
        return next()
    }else{
        res.send({notification:"you are not logged in"})
    }
}

//register route
app.post("/auth/register",async(req,res)=>{
    const{username,email,password}=req.body
        //information goes to the users collection
const user=userModel
const person=await user.findOne({email})

if(person){
    res.sendStatus(403).json({
        message:`a user with the email ${email} already exists`
    })
    return
}else{
const hashed_password= await bcrypt.hash(password,12)
await user.insertMany({
    email,username,password:hashed_password
}).then((results)=>{
    console.log(results)
    res.send({
        notification_msg:"You have been successfully registered"
    })
})
}
})

//login route
app.post('/auth/login',async(req,res)=>{
    const {email,password}=req.body
    //information goes to the database
    const user=userModel
    const person=await user.findOne({email})
    
    if(!person){
        res.send({notification_msg:'user does not exist please register first'})
    }else{
        const db_password=person.password
        bcrypt.compare(password,db_password,(err,result)=>{
            if(result){
                req.session.isValid_req=true;
                req.session.username=person.username
                res.send({isLogged_in:"successfully logged in"})
            }else{
                res.send({err_msg:"invalid login credentials"})
            }
        })
    }

})

//post question route
// NB: only authenticated users will be able to use this route
// a middleware called auth should therefore be created
app.post('/questions',auth,async(req,res)=>{
const user_question=req.body.user_question
const posted_by=req.session.username
const question=questionsModel
    //information goes to the questions collection
await question.insertMany({
    question:user_question,
    posted_by
}).then((result)=>{
    res.send(result)
})

})

// post answer route to a  quetion
// this is like entering comments
app.post('/questions/:id/answers',auth,(req,res)=>{
    const id=req.param.id
    const user_answer=req.body.user_answer
    // goes to the answers collection
})



//get all questions route
app.get('/questions',async(req,res)=>{
    //select all questions from the questions collection
    const questions=questionsModel;
    await questions.find().then((result)=>{
        res.send(result)
    })
})

//fetch a specific question route
app.get('/questions/:id',async(req,res)=>{
        //select all questions from the questions collection based on the id param
//the question should also come with the all answers provide to it
const id=req.params.id;
const question=questionsModel
if (ObjectId.isValid(id)){
    await question.findById({_id:id}).then((results)=>{
        res.send(results)
    })
}
})



app.delete('/questions/:id',auth,(req,res)=>{

})




app.listen(process.env.PORT_NO,(err)=>{
if(err){
    console.log(err)
}else{
console.log(`server running on ${PORT}`)
}
})