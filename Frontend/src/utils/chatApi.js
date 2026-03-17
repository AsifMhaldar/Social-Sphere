import axiosClient from "./axiosClient";

export const getUserConversations = (userId) =>
  axiosClient.get(`/chat/conversation/${userId}`);

export const getMessages = (conversationId) =>
  axiosClient.get(`/chat/message/${conversationId}`);

export const sendMessage = (data) =>
  axiosClient.post(`/chat/message`, data);

export const createConversation = (data) =>
  axiosClient.post(`/chat/conversation`, data);

export const getAllUsers = () =>
  axiosClient.get(`/user/all`);