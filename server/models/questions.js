// Question Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var QuestionSchema = new Schema({
    title: {type: String, required: true, maxLength: 50},
    summary: {type: String, required: true, maxLength: 140},
    text: {type: String, required: true},
    tags: [{type: Schema.Types.ObjectId, ref: 'Tag', required: true}],
    //answers: [{type: Schema.Types.ObjectId, ref: 'Answer'}],
    by: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    datetime: {type: Date, default: Date.now},
    views: {type: Number, default: 0},
    //comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
    votes: {type: Number, default: 0}
}, {toJSON: {virtuals: true}});

QuestionSchema.virtual('url').get(function () {
    return '/question/' + this._id;
});

QuestionSchema.virtual('answers', {
    ref: 'Answer',
    localField: '_id',
    foreignField: 'question'
});

QuestionSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'on'
});

module.exports = mongoose.model('Question', QuestionSchema);