import { clerkClient } from "@clerk/express"

// Middleware ( Protect Educator Routes )
export const protectEducator = async (req,res,next) => {

    try {

        const userId = req.auth.userId
        
        const response = await clerkClient.users.getUser(userId)

        if (response.publicMetadata.role !== 'educator' && response.publicMetadata.role !== 'admin') {
            // UPDATED: Send a 403 status code
            return res.status(403).json({success:false, message: 'Unauthorized Access: Not an Educator or Admin'})
        }
        
        next ()

    } catch (error) {
        res.status(500).json({success:false, message: error.message})
    }

}

// NEW MIDDLEWARE: Protect Admin Routes
export const protectAdmin = async (req,res,next) => {

    try {

        const userId = req.auth.userId
        
        const response = await clerkClient.users.getUser(userId)

        if (response.publicMetadata.role !== 'admin') {
            // UPDATED: Send a 403 status code
            return res.status(403).json({success:false, message: 'Unauthorized Access: Not an Admin'})
        }
        
        next ()

    } catch (error){
        // UPDATED: Send a 500 status code on error
        res.status(500).json({success:false, message: error.message})
    }

}