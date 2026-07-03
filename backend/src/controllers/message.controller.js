import User from "../models/User.js";
import Message from "../models/Message.js";
import { hasImageKitConfig } from "../lib/imagekit.js";


export async function getUsersForSidebar(req, res) {
    try {
        const loggedInUserId = req.user.id;

        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-clerkId")

        res.status(200).json(filteredUsers);

    } catch (error) {
        console.error("Error fetching users for sidebar:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getConversationsForSidebar(req, res) {
    try {
        const loggedInUserId = req.user.id;
        
        const conversations = await Message.aggregate([
            { $match: {$or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }]} },
            {
                $group: {
                    _id: { $cond: [{ $eq: ["$senderId", loggedInUserId] }, "$receiverId", "$senderId"] },
                    lastMessage: { $max: "$createdAt" },
                },
            },
            { $sort: { lastMessage: -1} },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $replaceRoot: { newRoot: { $first: "$user" } } },
            { $project: { clerkId: 0 } },
        ]);

        res.status(200).json(conversations)
    } catch (error) {
        console.error("Error in getConversationsForSidebar:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getMessages(req, res) {
    try {
        const {id: userToChat} = req.params;
        const MyId = req.user.id;

        const messages = await Message.find({
            $or: [
                { senderId: MyId, receiverId: userToChat },
                { senderId: userToChat, receiverId: MyId }
            ]
        }).sort({ createdAt: 1 })

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error fetching messages:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function sendMessage(req, res) {
    try {
        const { text } = req.body;
        const { id: receiverId }= req.params;
        const senderId = req.user.id;
        
        let imageUrl;
        let videoUrl;

        if(req.file){
            if(!hasImageKitConfig()){
                return res.status(500).json({ error: "ImageKit configuration is missing" });
            }

            const url = await uploadChatMedia(req.file)
            if(req.file.mimetype.startsWith("video/")) videoUrl = url;
            else imageUrl = url;
        }
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            video: videoUrl,
        })

        await newMessage.save();

        res.status(201).json(newMessage);

    } catch (error) {
        console.error("Error sending message:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}