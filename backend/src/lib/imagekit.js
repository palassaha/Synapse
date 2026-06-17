import Imagekit, { toFile } from "@imagekit/nodejs";
import dotenv from "dotenv";

dotenv.config();

const imagekit = new Imagekit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY });

function hasImagekitConfig() {
    return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

function createFileName(originalName = "upload") {
    const newName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `chat-${Date.now()}-${newName}`;
}

async function uploadMedia(file) {
    const fileName = createFileName(file.originalname);

    const result = await imagekit.files.upload({
        file: await toFile(file.buffer, fileName, { type: file.mimetype }),
        fileName,
        folder: "/chat-media",
    });

    return result.url;
}

export { hasImagekitConfig, uploadMedia };