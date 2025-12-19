import { Response, Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { addFriend, getFriends } from "../models/friendshipModel";
import { findUserByEmail } from "../models/userModel";

const router = Router();

// Add a friend by email
router.post(
  "/add-friend",
  authenticateToken,
  async (req: any, res: Response) => {
    const { email } = req.body;
    const userId = req.user.id;

    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
      const friend = await findUserByEmail(email);
      if (!friend) return res.status(404).json({ message: "User not found" });
      if (friend.id === userId)
        return res.status(400).json({ message: "Cannot add yourself" });

      await addFriend(userId, friend.id);
      res.json({
        message: "Friend added successfully",
        friend: {
          id: friend.id,
          username: friend.username,
          email: friend.email,
        },
      });
    } catch (error) {
      console.error("Add friend error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get friend list
router.get("/friends", authenticateToken, async (req: any, res: Response) => {
  const userId = req.user.id;
  try {
    const friends = await getFriends(userId);
    res.json(friends);
  } catch (error) {
    console.error("Get friends error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
