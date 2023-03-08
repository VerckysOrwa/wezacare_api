
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

mongoose.connect(process.env.ONLINE_DB_STRING||"mongodb+srv://verckysorwa:80dmCefeEE0m6HO7@cluster0.22lpjly.mongodb.net/?retryWrites=true&w=majority",{
    useUnifiedTopology:true,
    useNewUrlParser:true,
}).then(()=>console.log('db connection successfully established'))
.catch((err)=>console.log(err))

const store = new mongoSession({
	uri: process.env.ONLINE_DB_STRING||"mongodb+srv://verckysorwa:80dmCefeEE0m6HO7@cluster0.22lpjly.mongodb.net/?retryWrites=true&w=majority",
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

app.post("/auth/register",async(req,res)=>{
    const{username,email,password}=req.body
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

app.post('/auth/login',async(req,res)=>{
    const {email,password}=req.body
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

app.post('/questions',auth,async(req,res)=>{
const user_question=req.body.user_question
const posted_by=req.session.username
const question=questionsModel
await question.insertMany({
    question:user_question,
    posted_by
}).then((result)=>{
    res.send(result)
})

})

app.post('/questions/:id/answers',auth,async(req,res)=>{
    const id=req.params.id
    const answer={
        user_answer:await req.body.user_answer,
        posted_by:req.session.username
    }
	if (ObjectId.isValid(id)) {
		questionsModel.findByIdAndUpdate(
			id,
			{ $push: { answers: answer } },
			{ new: true }
		)
			.populate("answers.posted_by", "_id username")
			.then((result)=>{
					res.send(result);
				
            }).catch((err)=>{
                console.log(err)
            })
				
			
	} else {
		res.send(404, "<h3>Invalid request</h4>");
	}
})



app.get('/questions',async(req,res)=>{
    const questions=questionsModel;
    await questions.find().then((result)=>{
        res.send(result)
    })
})

app.get('/questions/:id',async(req,res)=>{
const id=req.params.id;
const question=questionsModel
if (ObjectId.isValid(id)){
    await question.findById({_id:id}).then((results)=>{
        res.send(results)
    })
}
})


app.put("/questions/:question_id/answers/:answer_id",async(req,res)=>{
    const {question_id,answer_id}=req.params
    const updated_answer={
        user_answer:await req.body.user_answer,
posted_by:req.session.username
    }
    if (ObjectId.isValid(question_id,answer_id)) {
		questionsModel.findByIdAndUpdate(
			question_id,
			{ $push: { answers:{updated_answer}} },
			{ new: true }
		)
			.then((result) => {
					console.log(result);
					res.send(result);
			}).catch((err)=>{
                console.log(err)
            })
	} else {
		res.send(404, "<h3>Invalid request</h4>");
	}

})

app.delete('/questions/:id',auth,async(req,res)=>{
const question_id=req.params.id
if(ObjectId.isValid(question_id)){
    await questionsModel.deleteOne({_id:question_id}).then((result)=>{
res.send({result,message:"Deleted successfully"})
    })
}
})





app.listen(process.env.PORT_NO,(err)=>{
if(err){
    console.log(err)
}else{
console.log(`server running on ${PORT}`)
}
})