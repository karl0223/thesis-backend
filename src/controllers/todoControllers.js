import ChatRoom from "../models/chatRoom.js";

const createTodoList = async (req, res) => {
  const { title, description, roomId } = req.body;
  const io = req.app.get("socketio");

  try {
    const todo = {
      title,
      description,
    };

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).send("Chat room not found");
    }

    if (chatRoom.owner.toString() !== req.user._id.toString()) {
      return res.status(401).send("Not authorized");
    }

    // Check if a todo with the same title already exists in the todo list
    const existingTodo = chatRoom.todoList.find((todo) => todo.title === title);
    if (existingTodo) {
      return res.status(400).send("Todo with the same title already exists");
    }

    chatRoom.todoList.push(todo);

    await chatRoom.save();

    const newTodo = chatRoom.todoList.find(
      (todoItem) => todoItem.title === title
    );

    io.to(roomId).emit("create-todo", newTodo);

    res.status(201).send(newTodo);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create todo list");
  }
};

const getTodoList = async (req, res) => {
  const { roomId } = req.params;
  try {
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).send("Chat room not found");
    }

    if (chatRoom.owner.toString() !== req.user._id.toString()) {
      return res.status(401).send("Not authorized");
    }

    res.status(200).send(chatRoom.todoList);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get todo list");
  }
};

const updateTodo = async (req, res) => {
  const { todoId, roomId, title, description, done } = req.body;
  const io = req.app.get("socketio");

  try {
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).send("Chat room not found");
    }

    if (chatRoom.owner.toString() !== req.user._id.toString()) {
      return res.status(401).send("Not authorized");
    }

    // Find the index of the todo in the todo list
    const todoIndex = chatRoom.todoList.findIndex(
      (todo) => todo._id.toString() === todoId
    );
    if (todoIndex === -1) {
      return res.status(404).send("Todo not found");
    }

    // Update the todo with the new values
    const updatedTodo = {
      _id: chatRoom.todoList[todoIndex]._id,
      title: title || chatRoom.todoList[todoIndex].title,
      description: description || chatRoom.todoList[todoIndex].description,
      done: done !== undefined ? done : chatRoom.todoList[todoIndex].done,
    };

    // Replace the old todo with the updated todo
    chatRoom.todoList[todoIndex] = updatedTodo;

    await chatRoom.save();

    io.to(roomId).emit("update-todo", updatedTodo);

    res.status(200).send(updatedTodo);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update todo");
  }
};

const deleteTodo = async (req, res) => {
  const { todoId, roomId } = req.body;
  const io = req.app.get("socketio");

  try {
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).send("Chat room not found");
    }

    if (chatRoom.owner.toString() !== req.user._id.toString()) {
      return res.status(401).send("Not authorized");
    }

    // Find the index of the todo in the todo list
    const todoIndex = chatRoom.todoList.findIndex(
      (todo) => todo._id.toString() === todoId
    );
    if (todoIndex === -1) {
      return res.status(404).send("Todo not found");
    }

    // Remove the todo from the todo list
    chatRoom.todoList.splice(todoIndex, 1);

    await chatRoom.save();

    io.to(roomId).emit("delete-todo", todoId);

    res.status(200).send("Todo deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete todo");
  }
};

export { createTodoList, getTodoList, updateTodo, deleteTodo };
