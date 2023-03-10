const mongoose=require('mongoose')

const QuestionsSchema=new mongoose.Schema({
    question:{
        type:String,
        required:true
    },
    posted_by:{
        type:String,
    },
    answers:[{
        user_answer:{
            type:String
        },
       posted_by:{
         type:String
        }
    }]

})

module.exports=mongoose.model('Question',QuestionsSchema)