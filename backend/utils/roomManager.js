const Room = require('../models/Room');
const Message = require('../models/Message');

// Check and delete rooms that have exceeded auto-delete time
const checkAndDeleteExpiredRooms = async () => {
  try {
    const now = new Date();

    // Find rooms that should be deleted
    const expiredRooms = await Room.find({
      autoDeleteAt: { $lte: now },
      isGeneral: false
    });

    for (const room of expiredRooms) {
      console.log(`Auto-deleting room: ${room.name} (creator: ${room.createdBy})`);

      // Delete all messages in the room
      await Message.deleteMany({ room: room.name });

      // Delete the room
      await Room.deleteOne({ _id: room._id });
    }

    if (expiredRooms.length > 0) {
      console.log(`Auto-deleted ${expiredRooms.length} inactive rooms`);
    }
  } catch (err) {
    console.error('Error checking expired rooms:', err.message);
  }
};

// Start the auto-deletion checker (runs every minute)
const startAutoDeleteChecker = () => {
  setInterval(checkAndDeleteExpiredRooms, 60 * 1000); // Check every minute
  console.log('✓ Auto-delete checker started');
};

module.exports = {
  checkAndDeleteExpiredRooms,
  startAutoDeleteChecker
};
