const express = require('express');
const app = express();
const server = require('http').createServer(app);
const User = require('../models/userSchema');
const { Encrypt, Decrypt } = require("../security/bcrypt");
const _ = require("lodash");
const { getToken } = require('../security/jwt')
const io = require('socket.io')(server, { cors: { origin: "*" } });
const Table = require('../models/tableSchema');

const signup = function (req, res) {
    const { name, password } = req.body;
    const userName = _.toLower(req.body.userName);
    const email = _.toLower(req.body.email);
    try {
        User.findOne({
            $or: [
                { userName: userName },
                { email: email }
            ]
        }, async function (error, foundUser) {
            if (foundUser) {
                if (foundUser.email === email) {
                    res.status(400).send({ message: "Email Already exists." });
                }
                else {
                    res.status(400).send({ message: "Username Already exists." });
                }
            } else {
                const encryptedPassword = await Encrypt(password);
                const user = new User({
                    name: name,
                    email: email,
                    userName: userName,
                    password: encryptedPassword,
                });
                user.save(function (e) {
                    if (!e) {
                        res.status(201).send({ message: "Successfully saved user data." });
                    }
                    else {
                        res.status(400).send({ message: "Error while saving data." });
                        console.log(e);
                    }
                });
            }
        });
    } catch (error) {
        res.status(400).send({ message: "SOMETHING WENT WRONG" });
        console.log(error);
    }
}

const login = function (req, res) {
    const { password } = req.body;
    const userName = _.toLower(req.body.userName);
    try {
        if (userName.includes('@')) {
            User.findOne({ email: userName }, async function (error, foundUser) {
                if (foundUser) {
                    const result = await Decrypt(password, foundUser.password);
                    if (result === true) {
                        const token = getToken({ userId: foundUser._id, userName: foundUser.userName, email: foundUser.email });
                        const { name, email, userName } = foundUser;
                        res.json({
                            name: name,
                            userName: userName,
                            email: email,
                            token: token,
                        });
                    }
                    else {
                        res.status(400).send({ message: "Invalid Password." });
                    }
                }
                else {
                    res.status(400).send({ message: "Invalid Email." });
                }
            });
        }
        else {
            User.findOne({ userName: userName }, async function (error, foundUser) {
                if (foundUser) {
                    const result = await Decrypt(password, foundUser.password);
                    if (result === true) {
                        const token = getToken({ userId: foundUser._id, userName: foundUser.userName, email: foundUser.email });
                        const { name, email, userName } = foundUser;
                        res.json({
                            name: name,
                            userName: userName,
                            email: email,
                            token: token,
                        });
                    }
                    else {
                        res.status(400).send({ message: "Invalid Password." });
                    }
                }
                else {
                    res.status(400).send({ message: "Invalid Username." });
                }
            });
        }
    } catch (error) {
        res.status(400).send({ message: "SOMETHING WENT WRONG" });
        console.log(error);
    }
}

const joinRoom = function (req, res) {
    const email = _.toLower(req.body.email);
    const userId = req.user.userId;
    try {
        User.findById(userId, async (error, user) => {
            if (user) {
                if (user.email === email) {
                    return res.status(400).send({ message: "You can't play with yourself." });
                }
                User.findOne({ email: email }, async (error, foundUser) => {
                    if (foundUser) {
                        const roomId = new Date().getTime().toString();

                        User.findByIdAndUpdate(userId, { $push: { rooms: roomId } }, (e) => {
                            if (e) {
                                res.status(400).send({ message: "Error while saving data." });
                            }
                        });
                        User.updateOne({ email: email }, { $push: { rooms: roomId } }, (e) => {
                            if (e) {
                                res.status(400).send({ message: "Error while saving data." });
                            }
                        });

                        const table = new Table({
                            roomId: roomId,
                            player1: user.userName,
                            player2: foundUser.userName,
                            message: `${user.userName}'s turn.`,
                            board: ["", "", "", "", "", "", "", "", ""],
                            turn: "X",
                            winner: "",
                            draw: false,
                        });
                        table.save((e) => {
                            if (!e) {
                                res.status(201).send({ message: "Successfully saved user data.", roomId: roomId });
                            }
                            else {
                                res.status(400).send({ message: "Error while saving data." });
                                console.log(e);
                            }
                        });
                    } else {
                        res.status(400).send({ message: 'User not found.' });
                    }
                })
            } else {
                res.status(401).send({ message: 'Unauthorized.' });
            }
        });
    } catch (error) {
        res.status(400).send({ message: "SOMETHING WENT WRONG" });
        console.log(error);
    }
}

const getRooms = function (req, res) {
    const userId = req.user.userId;
    try {
        User.findById(userId, async (error, user) => {
            if (user) {
                const rooms = user.rooms;
                const roomData = [];
                for (let i = 0; i < rooms.length; i++) {
                    const room = await Table.findOne({ roomId : rooms[i] });
                    roomData.push(room);
                }
                res.status(200).send({ message: "Successfully fetched rooms.", rooms: roomData });
            } else {
                res.status(401).send({ message: 'Unauthorized.' });
            }
        });
    } catch (error) {
        res.status(400).send({ message: "SOMETHING WENT WRONG" });
        console.log(error);
    }
}

module.exports = { signup, login, joinRoom , getRooms };