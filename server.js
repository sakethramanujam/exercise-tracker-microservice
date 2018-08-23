const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

app.use((req,res,next)=>{
return next({stattus:200,message:'success'})
})
// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

var Schema = mongoose.Schema

var userSchema = new Schema({
name:{
type:String,
required:true,
index:{unique:true}
},

uId: {
    type: String, 
    required: true,
    index: {
      unique: true
    }
},

timeC: {
    type: Date, 
    default: Date.now()
}
                              
})

var user = mongoose.model('user', userSchema)

var exerciseSchema = new Schema({
    uId:{
    type:String,
    required:true,
      index:{
        unique:true
      }
    },

    descrption:{
      type:String,
      required:true,
      index:{
        unique:true
      }
    },
    duration:{
      type:Date,
      required:true,
      index:{
      unique:true
      }
    },

    date:{
      type:Date,
      required:true,
      index:{
      unique:true
      }
    }  
})

var exercise = mongoose.model('exercise',exerciseSchema)

function formatDate() {
    var date = new Date(Date.now())
    var d = date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
    return d;
}

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

app.post('/api/exercise/new-user',function(request,response,next){
user.findOne({
        username: request.body.name
    }, (err, data) => {
        if (isEmpty(data)) {
            var genUserID = function () {
                var id = "";
                var set = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < 6; i++)
                    id += set.charAt(Math.floor(Math.random() * set.length))
                user.find({
                    userId: id
                }, (err, data) => {
                    if (err) console.log(err)
                    else {
                        console.log(id)
                    }
                })
                return id;
            }
            var new_user = new user({
                username: request.body.name,
                userId: genUserID()
            })

            console.log(new_user);
            new_user.save(err => {
                if (err) console.log(err)
                else {
                    response.json({
                        "username": new_user.username,
                        "userId": new_user.userId,
                        message: "Donot Forget this!"
                    })
                }
            })
        } else {
            console.log("User '" + request.body.name + "' already exists")
            next({
                message: "user already exists",
                status: 400
            });
        }
    })
})

function generateNew(new_username) {
    console.log("Generating new user: " + new_username);
}

app.post('/api/exercise/add',function(req,res,next){
  
    user.findOne({
        userId: req.body.userId
    }, (err, user) => {
        if (err) next(err)
        if (!user) {
            next({
                status: 400,
                message: "Unknown userId"
            })
        }

        const exerc = new exercise();

        exerc.userId = req.body.userId
        exerc.date = (req.body.date == null) ? formatDate() : req.body.date;
        exerc.description = req.body.description;
        exerc.duration = isNaN(req.body.duration) ? 0 : req.body.duration;

        exerc.save((err, savedData) => {
            if (err) {
                console.log(err)
                next({
                    status: 400,
                    message: err
                })
            }
            res.send(savedData)
        })
    })
})
app.get('/api/exercise/log/', function(req,res,next){
    const query_from = req.query.from == null ? new Date(0) : new Date(req.query.from);
    const query_to = req.query.to == null ? Date.now() : new Date(req.query.to);
    const query_user = req.query.userId;

    user.findOne({
        userId: req.query.userId
    }, (err, user_) => {
        if (err) next(err)
        if (!user_) {
            next({
                status: 400,
                message: user_ + "unknown"
            })
        }
        console.log(user_)

        exercise.find({
                userId: req.query.userId,
                date: {
                    $lt: query_to,
                    $gt: query_from
                }
            }, {
                __v: 0,
                _id: 0
            })
            .sort('-date')
            .limit(parseInt(req.query.limit))
            .exec((err, exer) => {
                if (err) return next(err)
                res.send(exer)
            })
    })

})

app.get('/api/users/', function(req,res,next){
    user.find({}, {
        "username": 1,
        "timestamp": 1,
        "_id": 0
    }, (err, data) => {
        if (err) {
            console.log(err)
            next({
                status: 400,
                message: "either null or error finding users"
            })
        }
       res.send(data)
    })

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
