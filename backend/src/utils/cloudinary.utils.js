import cloudinary from "../lib/cloudinary.js";
import fs from "fs";

/**
 * Uploads a file to Cloudinary and deletes the local temp file.
 * @param {string} localFilePath - Path to the local file
 * @param {string} folder - Cloudinary folder name
 */
export const uploadToCloudinary = async (localFilePath, folder) => {
  if (!localFilePath) return null;

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: "auto",
    });

    // Remove temp file after upload
    fs.unlinkSync(localFilePath);
    return result;
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};
