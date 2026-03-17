import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Get all users except current user
export const getAllUsers = async () => {
  return api.get("/users");
};

// Get user conversations
export const getUserConversations = async (userId) => {
  return api.get(`/conversations/${userId}`);
};

// Create or get conversation
export const createConversation = async ({ senderId, receiverId }) => {
  return api.post("/conversations", { senderId, receiverId });
};

// Get messages for conversation
export const getMessages = async (conversationId) => {
  return api.get(`/messages/${conversationId}`);
};

// Send message
export const sendMessage = async (messageData) => {
  return api.post("/messages", messageData);
};

// Mark messages as seen
export const markMessagesAsSeen = async (conversationId, userId) => {
  return api.put(`/messages/seen/${conversationId}`, { userId });
};