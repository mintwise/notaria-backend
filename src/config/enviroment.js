import { config } from "dotenv";

config();

const MONGO_URI = process.env.MONGO_URI;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;

export {
  MONGO_URI,
  AWS_BUCKET_NAME,
  AWS_BUCKET_REGION,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  FRONTEND_URL,
};
