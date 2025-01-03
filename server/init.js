// Setup database with initial test data.
// Include an admin user.
// Script should take admin credentials as arguments as described in the requirements doc.
const bcrypt = require('bcrypt'); // for password hashing and verifcation

let userArgs = process.argv.slice(2);

if (userArgs.length !== 2) {
    console.log("ERROR: You must provide 2 arguments: the first is the admin's email and the second is the admin's password.");
    return;
}

let Tag = require('./models/tags')
let Answer = require('./models/answers')
let Question = require('./models/questions')
let Comment = require('./models/comments');
let User = require('./models/users');


let mongoose = require('mongoose');
let mongoDB = "mongodb://127.0.0.1:27017/fake_so";
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.Promise = global.Promise;
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

let tags = [];
let answers = [];

function tagCreate(name, by) {
  let tag = new Tag({ name: name, by:by });
  return tag.save();
};

function questionCreate(title, summary, text, tags, by, datetime, views, votes) {
  qstndetail = {
    title: title,
    summary: summary,
    text: text,
    tags: tags,
    by: by
  }
  if (datetime != false) qstndetail.datetime = datetime;
  if (views != false) qstndetail.views = views;
  if (votes != false) qstndetail.votes = votes;

  let qstn = new Question(qstndetail);
  return qstn.save();
};

function answerCreate(text, by, question, datetime, votes) {
    answerdetail = {text:text, by:by, question:question};
    if (datetime != false) answerdetail.datetime = datetime;
    if (votes != false) answerdetail.votes = votes;
  
    let answer = new Answer(answerdetail);
    return answer.save();
};

function commentCreate(text, by, on, commentType, datetime, votes) {
    commentdetail = {text:text, by:by, on:on, commentType, commentType};
    if (datetime != false) answerdetail.datetime = datetime;
    if (votes != false) answerdetail.votes = votes;

    let comment = new Comment(commentdetail);
    return comment.save();
};

async function userCreate(username, email, password, isAdmin, datetime, reputation) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    userdetail = {username:username, email:email, password:passwordHash};
    if (isAdmin != false) userdetail.isAdmin = isAdmin;
    if (datetime != false) userdetail.datetime = datetime;
    if (reputation != false) userdetail.reputation = reputation;

    let user = new User(userdetail);
    return user.save();
};

const populate = async () => {
  let admin = await userCreate('ADMIN', userArgs[0], userArgs[1], true, new Date(2005, 12, 5), 9999999);
  let u1 = await userCreate('mrUser1', 'user1@aol.com', 'pw1', false, new Date(2022, 2, 3), 25);
  let u2 = await userCreate('msUser2', 'user2@aol.com', 'pw2', false, new Date(2023, 9, 1), false);
  
  let t1 = await tagCreate('react', u1);
  let t2 = await tagCreate('javascript', u1);
  let t3 = await tagCreate('android-studio', u2);
  let t4 = await tagCreate('shared-preferences', u2);
  let t5 = await tagCreate('admin-tag', admin);

  let q1 = await questionCreate('Programmatically navigate using React router', 
    'the alert shows the proper index for the li clicked...',
    'the alert shows the proper index for the li clicked, and when I alert the variable within the last function I\'m calling, moveToNextImage(stepClicked), the same value shows but the animation isn\'t happening. This works many other ways, but I\'m trying to pass the index value of the list item clicked to use for the math to calculate.',
    [t1, t2], u1, new Date(2023, 4, 4), false, 4);
  let q2 = await questionCreate('android studio save string shared preference', 
    'I am using bottom navigation view but am using custom navigation.',
    'I am using bottom navigation view but am using custom navigation, so my fragments are not recreated every time i switch to a different view. I just hide/show my fragments depending on the icon selected. The problem i am facing is that whenever a config change happens (dark/light theme), my app crashes. I have 2 fragments in this activity and the below code is what i am using to refrain them from being recreated.', 
    [t3, t4, t2], u2, new Date(2024, 1, 2), 4, 121);
    let q3 = await questionCreate('[ADMIN ANNOUNCEMENT]', 
    'Here is my summary.',
    'Please follow all rules and regulations for this site.', 
    [t5], admin, new Date(2024, 3, 17), 17, 11);
    let q4 = await questionCreate("What are the effects of climate change?", 
    "This question explores the impact of climate change on marine life and habitats.",
    "Climate change has far-reaching consequences on marine ecosystems, affecting species distribution, ocean acidification, coral bleaching, and sea level rise. Explore the various effects and potential solutions.",
    [t5], admin, new Date(2008, 0, 1), 50, 75);
    let q5 = await questionCreate("Artificial intelligence and jobs", 
    "This question delves into the intersection of AI and employment trends.",
    "Artificial intelligence has reshaped industries and job roles, leading to automation, new skill demands, and concerns about job displacement. Discuss the implications of AI on the job market.",
    [t5], admin, new Date(2010, 5, 15), 30, 90);
    let q6 = await questionCreate("global economic inequality", 
    "Explore the drivers behind disparities in global wealth distribution.",
    "Global economic inequality stems from various factors such as unequal access to education, resources, political power, and systemic injustices. Examine the root causes and potential solutions to address this issue.",
    [t5], admin, new Date(2009, 8, 23), 70, 40);
    let q7 = await questionCreate("How does social media influence you?", 
    "Investigate the impact of social media on human connections and relationships.",
    "Social media platforms have transformed the way people interact, affecting communication styles, intimacy levels, and societal norms. Analyze the effects of social media on interpersonal relationships.",
    [t5], admin, new Date(2011, 2, 8), 20, 63);

  let a1 = await answerCreate('React Router is mostly a wrapper around the history library. history handles interaction with the browser\'s window.history for you with its browser and hash histories. It also provides a memory history which is useful for environments that don\'t have a global history. This is particularly useful in mobile app development (react-native) and unit testing with Node.',
   u2, q1, new Date(2023, 4, 5), 5);
  let a2 = await answerCreate('On my end, I like to have a single history object that I can carry even outside components. I like to have a single history.js file that I import on demand, and just manipulate it. You just have to change BrowserRouter to Router, and specify the history prop. This doesn\'t change anything for you, except that you have your own history object that you can manipulate as you want. You need to install history, the library used by react-router.',
   admin, q1, new Date(2023, 4, 9), 9);
  let a3 = await answerCreate('Consider using apply() instead; commit writes its data to persistent storage immediately, whereas apply will handle it in the background.',
   admin, q2, new Date(2024, 1, 3), 3);
  let a4 = await answerCreate('YourPreference yourPrefrence = YourPreference.getInstance(context); yourPreference.saveData(YOUR_KEY,YOUR_VALUE);',
   u1, q2, new Date(2024, 4, 7), 5);
  let a5 = await answerCreate('I just found all the above examples just too confusing, so I wrote my own. ',
   u1, q2, new Date(2024, 1, 9), 9);
   
   let c1 = await commentCreate("This is a comment on a question", admin, q1, 'Question', false, false);
   let c2 = await commentCreate("This is a comment on an answer 1", admin, a1, 'Answer', false, false);
   let c3 = await commentCreate("This is a comment on an answer 2", admin, a1, 'Answer', false, false);
   let c4 = await commentCreate("This is a comment on an answer 3", admin, a1, 'Answer', false, false);
   let c5 = await commentCreate("This is a comment on an answer 4", admin, a1, 'Answer', false, false);
   let c6 = await commentCreate("This is a comment on an answer 5", admin, a1, 'Answer', false, false);
   let c7 = await commentCreate("This is a comment on an answer 6", admin, a1, 'Answer', false, false);
  
  
  if(db) db.close();
  console.log('done');
}

populate()
  .catch((err) => {
    console.log('ERROR: ' + err);
    if(db) db.close();
  });

console.log('processing ...');
