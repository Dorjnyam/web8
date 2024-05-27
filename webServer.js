var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://127.0.0.1/cs142project6', { useNewUrlParser: true, useUnifiedTopology: true });

const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const processFormBody = multer({ storage: multer.memoryStorage() }).single('uploadedphoto');
var MongoStore = require('connect-mongo')(session);
const fs = require("fs");

var express = require('express');
var app = express();
var async = require('async');

const { makePasswordEntry, doesPasswordMatch } = require('./cs142password');

var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

app.use(express.static(__dirname));

app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection : mongoose.connection })
}));

app.use(bodyParser.json());

app.post('/admin/login', (request, response) => {
    User.findOne({ login_name: request.body.login_name })
        .then(user => {
            if (!user) {

                console.log("Does not exist the user");
                response.status(400).json({ message: `Account "${request.body.login_name}" does not exist, please try again` });
            }
            else if (!doesPasswordMatch(user.password_digest, user.salt, request.body.passwordClearText)) {

                console.log("Password wrong");
                response.status(400).json({ message: `Password is not correct, please try again` });
            }
            else {

                console.log(`** Server: User logined: ${request.body.login_name}`);
                const userObj = JSON.parse(JSON.stringify(user));
                request.session.sessionUserID = userObj._id;
                request.session.sessionUserFirstName = userObj.first_name;
                request.session.sessionUserLastName = userObj.last_name;
                response.status(200).json({
                    first_name: userObj.first_name,
                    last_name: userObj.last_name,
                    id: userObj._id
                });
            }
        })
        .catch(error => {
            console.error(`** Error occured: ${error}. **`);
            response.status(400).json({ message: "Other error occured" });
        });
});

app.post('/admin/logout', (request, response) => {

    if (!request.session.sessionUserID) {
        response.status(400).json({ message: "User is not logged in" });
        console.log("You already logged out, no need to do again.");
    } else {

        request.session.destroy(err => {

            if (err) {
                console.log("Error in destroying the session");
                response.status(400).send();
            }
            else {

                console.log("OK");
                response.status(200).send();
            }
        });
    }
});

function hasSessionRecord(request, response, next) {
    if (request.session.sessionUserID) {
        next();
    }
    else {
        console.log("Session: the user is not logged in.");
        response.status(401).send('The user is not logged in.');
    }
}

app.post('/user', (request, response) => {
    const newUser = request.body;

    if (!(newUser.first_name && newUser.last_name && newUser.passwordClearText)) {
        response.status(400).json({ message: "The first_name, last_name, and password must be non-empty strings" });
        return;
    }

    User.findOne({ login_name: newUser.login_name })
        .then(user => {
            if (!user) {
                console.log("Storing the new user in DB...");

                const passwordEntry = makePasswordEntry(newUser.passwordClearText);
                newUser.password_digest = passwordEntry.hash;
                newUser.salt = passwordEntry.salt;
                delete newUser.passwordClearText;
                console.log(newUser);

                User.create(newUser)
                    .then(() => console.log("New User created in the DB"))
                    .catch(e => console.log("Error creating new user ", e));

                response.status(200).json({ message: "User created successfully!" });
            } else {
                console.log("User already exists!");
                console.log(user);
                response.status(400).json({ message: "The login name already exists, please choose a different login name" });
            }
        })
        .catch(error => {
            console.log("Error: user found user error", error);
            response.status(400).json({ message: "Other error occured: " });
        });
});

app.post('/photos/new', hasSessionRecord, (request, response) => {

    processFormBody(request, response, err => {

        if (err || !request.file) {
            console.log("Error in processing photo received from request", err);
            return;
        }

        if (request.file.buffer.size === 0) {
            request.status(400).json({ message: 'Error: Uploaded photo is empty' });
            return;
        }

        const timestamp = new Date().valueOf();
        const filename = 'U' + String(timestamp) + request.file.originalname;
        fs.writeFile(`./images/${filename}`, request.file.buffer, function (error) {
            if (error) console.log("Error during photo data writting into the images directory: ", error);
            else console.log("** Server: photo saved in the directory **");
        });

        Photo.create(
            {
                file_name: filename,
                date_time: timestamp,
                user_id: request.session.sessionUserID,
                comments: [],
                likes: [],
            },
            function (error, newPhoto) {
                if (error) {
                    response.status(400).send("unable to create new photo");
                }
                newPhoto.save();
                response.status(200).send();
            }
        );
    });
});

app.post('/commentsOfPhoto/:photo_id', hasSessionRecord, (request, response) => {

    if (Object.keys(request.body).length === 0) {
        response.status(400).json({ message: "Server: empty comment is not allowed" });
        return;
    }

    const commentText = request.body.comment;
    const photoID = request.params.photo_id;

    Photo.findOne({ _id: photoID })
        .then(photo => {
            if (!photo) {

                response.status(400).json({ message: "Server: Photo you just commented is not found" });
            } else {

                const commentObj = {
                    comment: commentText,
                    date_time: new Date().toISOString(),
                    user_id: request.session.sessionUserID
                };

                if (!photo.comments) photo.comments = [commentObj];
                else photo.comments.push(commentObj);
                photo.save();
                console.log("** Server: a new comment added! **");
                response.status(200).send();
            }
        })
        .catch(error => {
            response.status(400).json({ message: "Other error occured: " });
            console.error('Server: Error Finding Photo with Photo ID', error);
        });
});

app.get('/', hasSessionRecord, function (request, response) {
    console.log('Simple web server of files from ' + __dirname);
    response.send('Simple web server of files from ' + __dirname);
});

app.get('/test/:p1', hasSessionRecord, function (request, response) {

    var param = request.params.p1 || 'info';

    if (param === 'info') {

        SchemaInfo.find({}, function (err, info) {
            if (err) {

                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {

                response.status(500).send('Missing SchemaInfo');
                return;
            }

            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {

        var collections = [
            { name: 'user', collection: User },
            { name: 'photo', collection: Photo },
            { name: 'schemaInfo', collection: SchemaInfo }
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.countDocuments({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;

                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {

        response.status(400).send('Bad param ' + param);
    }
});

app.get('/user/list', hasSessionRecord, function (request, response) {
    User.find({}, function (err, users) {

        if (err) {
            console.log("** Get user list: Error! **");
            response.status(500).send(JSON.stringify(err));
        } else {

            console.log("** Server: found all users Success! **");
            const userList = JSON.parse(JSON.stringify(users));

            const newUsers = userList.map(user => {
                const { first_name, last_name, _id } = user;
                return { first_name, last_name, _id };
            });

            response.cookie('lastAccess', new Date().toISOString(), {httpOnly: true});
            response.status(200).json(newUsers);
        }
    });
});

function formatDateTime(dateTimeString) {
    const dateTime = new Date(dateTimeString);

    const options = { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    const dateTimeFormat = new Intl.DateTimeFormat('en-US', options);
    return dateTimeFormat.format(dateTime);
}

app.get('/user/:id', hasSessionRecord, function (request, response) {
    const userID = request.params.id;

    User.findOne({ _id: userID })
        .then(user => {
            if (!user) {

                console.log(`** User ${userID}: Not Found! **`);
            } else {

                const userObj = JSON.parse(JSON.stringify(user));
                delete userObj.__v;
                userObj.logged_user_first_name = request.session.sessionUserFirstName;
                userObj.logged_user_last_name = request.session.sessionUserLastName;
                userObj.logged_user_id = request.session.sessionUserID;
                response.status(200).json(userObj);
            }
        })
        .catch(error => {
            console.log(`** From "/user/:id": User ${userID}: Not Found! **`, error.message);
            response.status(400).json({ message: error.message });
        });
});

app.get('/user2/:id', hasSessionRecord, async function (request, response) {
    const userID = request.params.id;

    try {
        
        const user = await User.findOne({ _id: userID });

        if (!user) {
            console.log(`** User of ${userID}: Not Found! **`);
            return response.status(404).json({ message: `User not found` });
        }

        const userObj = JSON.parse(JSON.stringify(user));
        delete userObj.__v;
        userObj.logged_user_first_name = request.session.sessionUserFirstName;
        userObj.logged_user_last_name = request.session.sessionUserLastName;
        userObj.logged_user_id = request.session.sessionUserID;
        console.log(`** Server: login user: ${userObj.logged_user_first_name} found! **`);

        const photosData = await Photo.find({ user_id: userID });

        if (photosData.length === 0) {
            console.log(`** User has not posted any photos yet **`);
            return response.status(200).json(userObj);
        }

        const photos = JSON.parse(JSON.stringify(photosData));

        photos.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
        if (photos.length > 0) {
            userObj.mostRecentPhotoName = photos[0].file_name;
            userObj.mostRecentPhotoDate = formatDateTime(photos[0].date_time);
        }

        photos.sort((a, b) => b.comments.length - a.comments.length);
        if (photos.length > 0) {
            userObj.mostCommentedPhotoName = photos[0].file_name;
            userObj.commentsCount = photos[0].comments.length;
        }

        return response.status(200).json(userObj);
    } catch (error) {
        console.log(`** From "/user/:id": User ${userID}: Not Found! **`);
        console.log("Error: ", error.message);
        return response.status(500).json({ message: "Internal Server Error" });
    }
});

function processPhotoLike(photos, response) {

    let processedPhotos = 0;

    photos.forEach(photo => {
        async.eachOf(photo.likes, (liked_user_id, index, done_callback) => {

            User.findOne({ _id: liked_user_id }, (error, user) => {
                if (!error) {
                    const userObj = JSON.parse(JSON.stringify(user));
                    const { location, description, occupation, __v, password_digest, salt, login_name, ...rest } = userObj;
                    photo.likes[index] = rest;
                }
                done_callback(error);
            });
        }, err => {
            processedPhotos += 1;
            if (err) {
                response.status(400).json({ message: "Error occured in finding likes under a photo" });
                return;
            }
            if (processedPhotos === photos.length) {

                response.status(200).json(photos);
            }
        });
    });
}

function sortedPhotos(photos) {
    return photos.sort((a, b) => {

        if (b.likes.length !== a.likes.length) {
            return b.likes.length - a.likes.length;
        }

        return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
    });
}

app.get('/photosOfUser/:id', hasSessionRecord, function (request, response) {
    const id = request.params.id;

    Photo.find({ user_id: id }, (err, photosData) => {
        if (err) {
            console.log(`Photos with user id ${id}: Not Found`);
            response.status(400).json({ message: `Photos with user id ${id}: Not Found` });
        }

        const photos = JSON.parse(JSON.stringify(photosData));
        if (photos.length === 0) {
            console.log(`Sending photos of Null value to front-end: `, null);
            response.status(200).json(null);
        }

        sortedPhotos(photos);
        let processedPhotos = 0;
        photos.forEach(photo => {
            delete photo.__v;
            photo.date_time = formatDateTime(photo.date_time);

            async.eachOf(photo.comments, (comment, index, done_callback) => {

                User.findOne({ _id: comment.user_id }, (error, user) => {
                    if (!error) {
                        const userObj = JSON.parse(JSON.stringify(user));
                        const { location, description, occupation, __v, ...rest } = userObj;
                        photo.comments[index].user = rest;
                        delete photo.comments[index].user_id;
                    }
                    done_callback(error);
                });
            }, err1 => {
                processedPhotos += 1;
                if (err1) {
                    response.status(400).json({ message: "Error occured in finding commments under a photo" });
                    return;
                }
                if (processedPhotos === photos.length) {
                    processPhotoLike(photos, response);
                }
            });
        });
    });
});

app.post('/like/:photo_id', (request, response) => {

    if (Object.keys(request.body).length === 0) {
        response.status(400).json({ message: "Server: empty comment is not allowed" });
        return;
    }

    const photoID = request.params.photo_id;
    const userID = request.body.action;

    Photo.findOne({ _id: photoID })
        .then(async photo => {
            if (!photo) {
                response.status(400).json({ message: "Server: Photo you just commented is not found" });
            }

            try {
                const release = await mutex.acquire();
                if (photo.likes.includes(userID)) {
                    let indexToRemove = photo.likes.indexOf(userID);
                    if (indexToRemove !== -1) {
                        photo.likes.splice(indexToRemove, 1);
                    }
                } else {
                    photo.likes.push(userID);
                }
                console.log(`** Server: ${userID} clicked like button! **`);
                photo.save();
                release();
                response.status(200).json({ message: "Like updated successfully!" });
            } catch (error) {
                response.status(500).json({ message: 'Internal server error' });
            }
        })
        .catch(error => {
            response.status(400).json({ message: "Other error occured: " });
            console.error('Server: Error Updating like info', error);
        });
});

app.post('/deleteUser/:id', async (request, response) => {
    const userIdToRemove = request.params.id;
    console.log("User to remove: " + userIdToRemove);
    try {
        const result = await User.findByIdAndDelete(userIdToRemove);
        console.log('Deleted the User: ', result);

        const userPhotos = await Photo.find({ user_id: userIdToRemove });
        const deletionPromises = userPhotos.map(async (photo) => {
            const deletedPhoto = await Photo.findByIdAndDelete(photo._id);
            console.log('Deleted Photo:', deletedPhoto);
        });
        await Promise.all(deletionPromises);

        let updatedPhoto;
        const allPhotos = await Photo.find();
        const updatePromises = allPhotos.map(async (photo) => {

            if (photo.likes.includes(userIdToRemove)) {
                updatedPhoto = await Photo.finByIdAndUpdate(photo._id, { $pull: { likes: userIdToRemove } }, { new: true });
            }
            const commentsToDelete = photo.comments.filter(comment => comment.user_id.toString() === userIdToRemove);
            const commentUpdatePromises = commentsToDelete.map(async (commentToDelete) => {
                updatedPhoto = await Photo.findByIdAndUpdate(photo._id, { $pull: { comments: commentToDelete } }, { new: true });
            });

            const combinedPromises = updatedPhoto ? [updatedPhoto, ...commentUpdatePromises] : commentUpdatePromises;
            return combinedPromises;
        });

        const flattenedPromises = updatePromises.flat();
        await Promise.all(flattenedPromises);
        response.status(200).json({ message: "User deleted successfully!" });
    } catch (error) {
        console.error('Error destroying User:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/deleteComment/:id', async (request, response) => {
    const commentIdToDelete = request.params.id;
    const photoID = request.body.photo_id;

    try {
        const photo = await Photo.findById(photoID);
        if (!photo) {
            console.log("Photo not found");
            response.status(404).json({ message: 'Photo not found' });
        }
        console.log("Photo found: ", photo);
        const commentToDelete = photo.comments.filter(comment => comment._id.toString() === commentIdToDelete);
        if (commentToDelete.length !== 1) {
            console.log("Comment not found");
            response.status(404).json({ message: 'Comment not found' });
        }
        const updatedPhoto = await Photo.findByIdAndUpdate(photoID, { $pull: { comments: commentToDelete[0] } }, { new: true });
        if (updatedPhoto) {
            console.log("Updated photo: ", updatedPhoto);
            response.status(200).json({ message: "Comment deleted successfully!" });
        }
    } catch (error) {
        console.error('Error deleting comment:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/deletePhoto/:id', async (request, response) => {
    const photoIdToDelete = request.params.id;
    try {
        const deleted_photo = await Photo.findByIdAndDelete(photoIdToDelete);
        if (!deleted_photo) {
            console.log("Photo not found");
            response.status(404).json({ message: 'Photo not found' });
        }
        response.status(200).json({ message: "Photo deleted successfully!" });
    } catch (error) {
        console.error('Error deleting comment:', error.message);
        response.status(500).json({ message: 'Internal server error' });
    }
});

var server = app.listen(3000, () => {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
