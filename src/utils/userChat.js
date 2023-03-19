// Send friend request
app.post("/api/friends/request", async (req, res) => {
  try {
    const { recipientId } = req.body;

    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).send("Recipient not found");
    }

    if (
      recipient.friendRequests.includes(req.user._id) ||
      recipient.friends.includes(req.user._id)
    ) {
      return res.status(400).send("Friend request already sent");
    }

    const friendRequest = new FriendRequest({
      sender: req.user._id,
      recipient: recipientId,
    });

    await friendRequest.save();

    recipient.friendRequests.push(friendRequest._id);

    await recipient.save();

    io.emit("friendRequest", friendRequest);

    return res.status(200).send("Friend request sent");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Accept friend request
app.post("/api/friends/accept", async (req, res) => {
  try {
    const { friendRequestId } = req.body;

    const friendRequest = await FriendRequest.findById(friendRequestId);

    if (!friendRequest) {
      return res.status(404).send("Friend request not found");
    }

    const sender = await User.findById(friendRequest.sender);

    if (!sender) {
      return res.status(404).send("Sender not found");
    }

    const recipient = await User.findById(friendRequest.recipient);

    if (!recipient) {
      return res.status(404).send("Recipient not found");
    }

    sender.friends.push(recipient._id);
    recipient.friends.push(sender._id);

    await sender.save();
    await recipient.save();

    await friendRequest.remove();

    io.emit("friendAccept", {
      senderId: sender._id,
      recipientId: recipient._id,
    });

    return res.status(200).send("Friend request accepted");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Get friend list
app.get("/api/friends", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "friends",
      "username"
    );
    return res.status(200).json(user.friends);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Get friend requests
app.get("/api/friends/requests", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: "friendRequests",
        populate: {
          path: "sender",
          select: "username",
        },
      })
      .exec();

    return res.status(200).json(user.friendRequests);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Create chat
app.post("/api/chats", async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const recipient = await User.findById(recipientId);

    if (!recipient) {
      return res.status(404).send("Recipient not found");
    }

    const chat = new Chat({
      participants: [req.user._id, recipientId],
      messages: [
        {
          sender: req.user._id,
          message,
        },
      ],
    });

    await chat.save();

    io.emit("chatMessage", chat);

    return res.status(200).send("Chat created");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Get chats
app.get("/api/chats", async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "username")
      .populate("messages.sender", "username")
      .exec();

    return res.status(200).json(chats);
  } catch (error) {
    console.error(error);
    return res.status(500);
  }
});

// Send chat message
app.post("/api/chats/:chatId", async (req, res) => {
  try {
    const { message } = req.body;

    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).send("Chat not found");
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(401).send("Unauthorized");
    }

    chat.messages.push({
      sender: req.user._id,
      message,
    });

    await chat.save();

    io.emit("chatMessage", chat);

    return res.status(200).send("Message sent");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});

// Get user info
app.get("/api/user", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
});
