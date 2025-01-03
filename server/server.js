// Application server
const express = require('express'); // for web-server
const session = require('express-session'); // for session management
const mongoose = require('mongoose'); // access to DB for application data
const MongoStore = require('connect-mongo'); //access to DB for session data
const bcrypt = require('bcrypt'); // for password hashing and verifcation
const cors = require('cors'); // to manage cross-site resource sharing

const db_adr = 'mongodb://127.0.0.1:27017/fake_so'; //db address
mongoose.connect(db_adr);
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const saltRounds = 10; 

const app = express();
const port = 8000;

app.use(cors({origin: 'http://localhost:3000', credentials: true}));
app.use(express.json());

const hour = 1000 * 60 * 60;

let Question = require('./models/questions.js');
let Answer = require('./models/answers.js');
let Tag = require('./models/tags.js');
let User = require('./models/users.js');
let Comment = require('./models/comments.js');

app.use(
    session({
      secret: "EMPddFIbw2eUzqjsbTSy4PCdGIzNkw3Y",
      cookie: {httpOnly: true, maxAge: hour},
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/fake_so'})
    })
);

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    }
    else {
        next('route');
    }
}

//app.use(isAuthenticated);

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

// Handle process termination (CTRL+C) using signal handler
process.on('SIGINT', async () => {
    console.log("Server closing. Disconnecting database...");
    
    try {
      // Close the MongoDB connection
      await mongoose.disconnect();
      console.log("Database instance disconnected.");
    } catch (error) {
      console.error("Error disconnecting database:", error);
    }
  
    // Close the Express server
    server.close(() => {
      console.log("Server closed.");
      process.exit(0); // Exit the process
    });
  });

app.post('/register', async (req, res) => {
    const user = req.body;
    const userExists = await User.findOne({email: user.email}).exec();
    if (userExists) {
        res.send({success: false, msg:`User with email "${user.email}" already exists.`});
        return;
    }
    console.log("Registering: ", user.username);
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(user.password, salt);
    user.password = passwordHash;
    const newUser = new User(user);
    const savedUser = await newUser.save();
    res.send({success:true, user:savedUser});
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email: email}).populate(['questions', 'answers', 'tags']).exec();
    console.log("UID:", email);
    console.log("USER:", user);
    if (!user) { return res.send({success: false, msg: "Unregistered email entered."}); }
    let verdict = await bcrypt.compare(password, user.password);
    
    console.log("VERDICT:", verdict);
    if (verdict) {
        req.session.regenerate(function(err) {
            if (err) { next(err); }
            req.session.user = user;
            req.session.save(function (err) {
                if (err) { return next(err); }
                res.send({success: true, user:user});
            });
        });
    }
    else {
        res.send({success: false, msg: "Incorrect password entered."})
    }
});

app.get('/logout', async (req, res) => {
    req.session.destroy(function(err){
        console.log("Logged out user.");
        res.send("Logged out user.");
    });
});

app.get('/session', async (req, res) => {
    res.send(req.session);
});

app.get('/refreshSession', async (req, res) => {
    if (req.session.user) {
        const user = await User.findOne({_id: req.session.user._id}).populate(['questions', 'answers', 'tags']).exec();
        req.session.user = user;
        res.send(user);
    } else {
        res.send(false);
    }
});

app.get('/questions/:sort', async (req, res) => {
    let questions = await Question.find().populate(['tags', 'by', 'answers', 'comments']).sort({datetime: -1}).exec();
    if (req.params.sort === 'unanswered') {
        questions = questions.filter(q => q.answers.length===0);
    } else if (req.params.sort === 'active') {
        questions = questions.sort(function(q1, q2) {
            if (q1.answers.length === 0) return 1;
            if (q2.answers.length === 0) return -1;
            return Math.max(...q2.answers.map(a => a.datetime)) - Math.max(...q1.answers.map(a => a.datetime));
        });
    }
    res.send(questions);
});

app.get('/user/:id', async (req, res) => {
    const user = await User.findOne({_id: req.params.id}).populate(['questions', 'answers', 'tags']).exec();
    res.send(user);
});

app.get('/users', async (req, res) => {
    res.send(await User.find().populate(['questions', 'answers', 'tags']).exec());
});

app.get('/question/:qid', async (req, res) => {
    res.send(await Question.findOne({_id: req.params.qid}).populate(['tags', 'by', 'answers', 'comments']).exec());
});

app.get('/answers/:qid', async (req, res) => {
    res.send(await Answer.find({question: req.params.qid}).populate(['by', 'comments']).populate(
        {path: 'comments', populate: {path:'by'}}
    ).sort({datetime: -1}).exec());
});

app.get('/tags', async (req, res) => {
    res.send(await Tag.find().populate('questions').exec());
});

app.post('/vote', async (req, res) => {
    // Update vote count for item
    const {type, id, vote, upvote, repUser} = req.body;
    const col = type==='comment' ? Comment : (type==='answer' ? Answer : Question);
    col.updateOne({_id: id}, {$inc: {votes: vote}}).exec();

    // Update users voted items
    const user = req.session.user;
    if (upvote === (vote>0)) { // added a vote
        const pushItem = type==='comment' ? {votedComments: id} :
                        (type==='answer' ?  {votedAnswers: {answer:id, upvote:upvote} }:
                                            {votedQuestions: {question:id, upvote:upvote} });
        User.updateOne({_id: user._id}, {$push: pushItem}).exec();
    } else { // removed a vote
        const pullItem = type==='comment' ? {votedComments: id} :
                        (type==='answer' ?  {votedAnswers: {answer:id} }:
                                            {votedQuestions: {question:id} });
        User.updateOne({_id: user._id}, {$pull: pullItem}).exec();
    }
    
    // Update reputation
    if (type !== "comment") {
        let reputationChange;
        if (upvote) {
            if (vote === -1) reputationChange = -5;
            if (vote === 2) reputationChange = 15;
            if (vote === 1) reputationChange = 5;
        } else {
            if (vote === 1) reputationChange = 10;
            if (vote === -2) reputationChange = -15;
            if (vote === -1) reputationChange = -10;
        }
        User.updateOne({_id: repUser._id}, {$inc: {reputation: reputationChange}}).exec();
    }
});

app.post('/incrementViews', async (req, res) => {
    res.send(await Question.updateOne({_id: req.body.id}, {$inc: {'views': 1}}).exec());
});

app.post('/createNewItem', async (req, res) => {
    const user = req.session.user;
    const itemType = req.body.itemType;
    const item = req.body.item;
    console.log("Creating new " + itemType + ": ", item);
    switch (itemType) {
        case "question":
            const tags = await Tag.find({'name': {'$in': item.tags}});
            const tagNames = tags.map(t => t.name);
            const missingTags = item.tags.filter(t => !tagNames.includes(t));
            if (missingTags.length > 0 && user.reputation < 50) { res.send({success:false, msg:"You need at least 50 reputation to create a new tag."}); return; }
            const newTags = await Promise.all(missingTags.map(async (t) => new Tag({name: t, by: user._id}).save() ));
            item.tags = tags.map(t => t._id).concat(newTags.map(t => t._id));
            res.send({success:true, item: await (new Question(item)).save()});
            break;
        case "answer":
            res.send({success:true, item: await (new Answer(item)).save()});
            break;
        case "comment":
            res.send({success:true, item: await (new Comment(item)).save()});
            break;
        default:
            break;
    }
});

app.post('/editItem', async (req, res) => {
    const user = req.session.user;
    const itemType = req.body.itemType;
    const item = req.body.item;
    const id = req.body.id;
    console.log("Editing " + itemType + ": ", id , item);
    switch (itemType) {
        case "question":
            const tags = await Tag.find({'name': {'$in': item.tags}});
            const tagNames = tags.map(t => t.name);
            const missingTags = item.tags.filter(t => !tagNames.includes(t));
            if (missingTags.length > 0 && user.reputation < 50) { res.send({success:false, msg:"You need at least 50 reputation to create a new tag."}); return; }
            const newTags = await Promise.all(missingTags.map(async (t) => new Tag({name: t, by: user._id}).save() ));
            item.tags = tags.map(t => t._id).concat(newTags.map(t => t._id));
            res.send(await Question.updateOne({_id:id}, item).exec());
            break;
        case "answer":
            res.send(await Answer.updateOne({_id:id}, item).exec());
            break;
        case "comment":
            res.send(await Comment.updateOne({_id:id}, item).exec());
            break;
        case "tag":
            if (user.isAdmin) {
                res.send({success:true, update: await Tag.updateOne({_id:id}, item).exec()});
                return;
            }
            let questions = await Question.find().exec();
            for (let q of questions) {
                if (String(q.by) !== user._id && q.tags.includes(id)) {
                    res.send({success: false, msg: `Cannot modify tag. Tag is being used in the following question, owned by a diiferent user: ${q.title}`})
                    return;
                }
            }
            res.send({success:true, update: await Tag.updateOne({_id:id}, item).exec()});
            break;
        default:
            break;
    }
});

async function deleteQuestion(id) {
    const question = await Question.findOne({_id:id}).populate(['answers', 'comments']).populate(
        {path: 'answers', populate: {path:'comments'}}).exec();
    await (question.answers.forEach(async (a) => {
        await (a.comments.forEach(async (c) => {
            console.log("Deleting comment: ", c);
            console.log(await Comment.deleteOne({_id: c._id}));
        }));
        console.log("Deleting answer: ", a);
        console.log(await Answer.deleteOne({_id: a._id}));
    }));
    await (question.comments.forEach(async (c) => {
        console.log("Deleting comment: ", c);
        console.log(await Comment.deleteOne({_id: c._id}));
    }));
    console.log("Deleting question: ", question);
    console.log(await Question.deleteOne({_id: id}));
    return true;
}

app.post('/deleteQuestion', async (req, res) => {
    const id = req.body.id;
    res.send({success: await deleteQuestion(id)});
});

app.post('/deleteTag', async (req, res) => {
    const id = req.body.id;
    const user = req.session.user;
    if (user.isAdmin) {
        console.log("Deleting tag: ", id);
        console.log(await Tag.deleteOne({_id: id}));
        res.send({success: true});
        return;
    }
    let questions = await Question.find().exec();
    for (let q of questions) {
        if (String(q.by) !== user._id && q.tags.includes(id)) {
            res.send({success: false, msg: `Cannot delete tag. Tag is being used in the following question, owned by a different user: ${q.title}`})
            return;
        }
    }
    console.log("Deleting tag: ", id);
    console.log(await Tag.deleteOne({_id: id}));
    res.send({success: true});
});

async function deleteAnswer(id) {
    const a = await Answer.findOne({_id:id}).populate(['comments']).exec();
    console.log(a);
    await (a.comments.forEach(async (c) => {
        console.log("Deleting comment: ", c);
        console.log(await Comment.deleteOne({_id: c._id}));
    }));
    console.log("Deleting answer: ", a);
    console.log(await Answer.deleteOne({_id: a._id}));
    return true;
}

app.post('/deleteAnswer', async (req, res) => {
    const id = req.body.id;
    res.send({success: await deleteAnswer(id)});
});

app.post('/deleteUser', async (req, res) => {
    const id = req.body.id;
    const user = await User.findOne({_id:id}).populate(['comments','answers','questions']).exec();

    await user.comments.forEach(async (cid) => await Comment.deleteOne({_id: cid}));
    await user.answers.forEach(async (qid) => await deleteAnswer(qid));
    await user.questions.forEach(async (aid) => await deleteQuestion(aid));

    console.log("Deleting user: ", user);
    console.log(await User.deleteOne({_id: id}));
    res.send({success: true});
});