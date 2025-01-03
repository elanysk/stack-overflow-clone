// Tag Document Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TagSchema = new Schema({
    name: {type: String, required:true},
    by: {type: Schema.Types.ObjectId, ref: 'User', required: true}
}, {toJSON: {virtuals: true}});

TagSchema.virtual('questions', {
    ref: 'Question',
    localField: '_id',
    foreignField: 'tags'
});

TagSchema.virtual('url').get(function () {
    return '/posts/tag/' + this._id;
});

module.exports = mongoose.model('Tag', TagSchema);