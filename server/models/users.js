// User Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuestionVoteSchema = new Schema({
    question: {type: Schema.Types.ObjectId, ref: 'Question'},
    upvote: {type: Boolean}
})

var AnswerVoteSchema = new Schema({
    answer: {type: Schema.Types.ObjectId, ref: 'Answer'},
    upvote: {type: Boolean}
})

var UserSchema = new Schema({
    username: {type: String, required:true},
    email: {type: String, required:true},
    password: {type: String, required:true},
    isAdmin: {type: Boolean, default:false},
    datetime: {type: Date, default: Date.now},
    reputation: {type: Number, default: 50},
    //questions: [{type: Schema.Types.ObjectId, ref: 'Question'}],
    //answers: [{type: Schema.Types.ObjectId, ref: 'Answer'}],
    //tags: [{type: Schema.Types.ObjectId, ref: 'Tag'}],
    votedQuestions: [{type: QuestionVoteSchema}],
    votedAnswers: [{type: AnswerVoteSchema}],
    votedComments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
}, {toJSON: {virtuals: true}});

UserSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'by'
});

UserSchema.virtual('answers', {
    ref: 'Answer',
    localField: '_id',
    foreignField: 'by'
});

UserSchema.virtual('tags', {
    ref: 'Tag',
    localField: '_id',
    foreignField: 'by'
});

UserSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'by'
})

UserSchema.virtual('url').get(function () {
    return '/user/' + this._id;
}, {toJSON: {virtuals: true}});

module.exports = mongoose.model('User', UserSchema);