import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        ref: 'User', 
        required: true,
        unique: true // A user can only apply once
    },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
}, { timestamps: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;