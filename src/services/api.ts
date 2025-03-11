import axios from "axios";

const BASE_URL = "https://assignment.devotel.io/api";

export const api = axios.create({
  baseURL: BASE_URL,
});

export const getDynamicForm = async () => {
  const res = await api.get("/insurance/forms");
  return res.data;
};

export const getSubmissions = async () => {
  const res = await api.get("/insurance/forms/submissions");
  return res.data;
};

export const submitFormData = async (data: Record<string, any>) => {
  const res = await api.post("/insurance/forms/submit", data);
  return res.data;
};