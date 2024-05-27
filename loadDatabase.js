var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://127.0.0.1/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

var cs142models = require('./modelData/photoApp.js').cs142models;

var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var versionNumber = 1.01;

var removePromises = [User.deleteMany({}), Photo.deleteMany({}), SchemaInfo.deleteMany({})];

Promise.all(removePromises).then(function () {
    var userModels = cs142models.userListModel();
    var mapFakeId2RealId = {};
    var userPromises = userModels.map(function (user) {
        return User.create({
            first_name: user.first_name,
            last_name: user.last_name,
            location: user.location,
            description: user.description,
            occupation: user.occupation,
            login_name: user.last_name.toLowerCase(),
            password_digest: '3c53e115625c62868a32faaee3e0021b27850541',
            salt: "12345678",
        }).then(function (userObj) {

            userObj.save();
            mapFakeId2RealId[user._id] = userObj._id;
            user.objectID = userObj._id;
            console.log('Adding user:');
            console.log(user);
            console.log('Adding userObj:');
            console.log(userObj);

        }).catch(function (err) {
            console.error('Error create user', err);
        });
    });

    var allPromises = Promise.all(userPromises).then(function () {
        var photoModels = [];
        var userIDs = Object.keys(mapFakeId2RealId);
        for (var i = 0; i < userIDs.length; i++) {
            photoModels = photoModels.concat(cs142models.photoOfUserModel(userIDs[i]));
        }
        var photoPromises = photoModels.map(function (photo) {

            const likesObj = photo.likes.map(fakeID => mapFakeId2RealId[fakeID]);
            return Photo.create({
                file_name: photo.file_name,
                date_time: photo.date_time,
                user_id: mapFakeId2RealId[photo.user_id],
                likes: likesObj,
            }).then(function (photoObj) {
                photo.objectID = photoObj._id;
                if (photo.comments) {
                    photo.comments.forEach(function (comment) {
                        photoObj.comments = photoObj.comments.concat([{
                            comment: comment.comment,
                            date_time: comment.date_time,
                            user_id: comment.user.objectID
                        }]);
                    });
                }

                photoObj.save();
            }).catch(function (err) {
                console.error('Error create user', err);
            });
        });
        return Promise.all(photoPromises).then(function () {
            return SchemaInfo.create({
                version: versionNumber,
            }).then(function (schemaInfo) {
                console.log('SchemaInfo Object: ', schemaInfo, ' created with version ', versionNumber);
            }).catch(function (err) {
                console.error('Error create schemaInfo', err);
            });
        });
    });

    allPromises.then(function () {
        mongoose.disconnect();
    });

}).catch(function (err) {
    console.error('Error create schemaInfo', err);
});
