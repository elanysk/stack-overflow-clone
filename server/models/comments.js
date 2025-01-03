// Comment Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    text: {type: String, required: true},
    by: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    on: {type: Schema.Types.ObjectId, refPath: 'commentType', required: true},
    commentType:  {type: String, enum: ['Question', 'Answer'], required: true},
    datetime: {type: Date, default: Date.now},
    votes: {type: Number, default: 0}
});

CommentSchema.virtual('url').get(function () {
    return '/comment/' + this._id;
});

module.exports = mongoose.model('Comment', CommentSchema);