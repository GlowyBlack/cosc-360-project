import mongoose from "mongoose";

const RequestSchema = new mongoose.Schema({
    bookId: {type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true},
    bookOwner: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, //owner of bookID
    requesterId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}, //person requesting exchange
    type: {type: String, enum: ["Borrow", "Exchange",], required: true},
    offeredBookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: function() { return this.type === 'Exchange'; }},
    returnBy: {type: Date, required: function () { return this.type === 'Borrow'}},
    status: {type: String, enum: ["Pending", "Accepted", "Declined", "Returned", "Cancelled"], default: "Pending"},
}, { timestamps: true });

RequestSchema.index(
    { bookId: 1, requesterId: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "Pending" },
    }
);
export default mongoose.model("Request", RequestSchema);