// Answer Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnswerSchema = new Schema({
    text: {type: String, required: true},
    by: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    question: {type: Schema.Types.ObjectId, ref: 'Question', required: true},
    datetime: {type: Date, default: Date.now},
    //comments: [{type: Schema.Types.ObjectId, ref: 'Comment'}],
    votes: {type: Number, default: 0}
}, {toJSON: {virtuals: true}});

AnswerSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'on'
});

AnswerSchema.virtual('url').get(function () {
    return '/posts/answer/' + this._id;
});

module.exports = mongoose.model('Answer', AnswerSchema);