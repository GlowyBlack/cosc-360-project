import mongoose from "mongoose";
// import {v4 as uuidv4} from 'uuid';

const RequestSchema = new mongoose.Schema({
    bookId: {type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true},
    bookOwner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, //owner of bookID
    requesterId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, //person requesting exchange
    type: {type: String, enum: ["Borrow", "Exchange",], required: true},
    offeredBookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: function() { return this.type === 'Exchange'; }},
    status: {type: String, enum: ["Pending", "Accepted", "Declined", "Returned"], default: "Pending"},
}, { timestamps: true });

export default mongoose.model("Request", RequestSchema);