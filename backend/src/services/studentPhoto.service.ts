import {
  cloudinary
} from "../config/cloudinary.js";

export function createStudentPhotoSignature() {
  const timestamp =
    Math.round(
      Date.now() / 1000
    );

  const folder =
    "schoolay/student-photos";

  const parametersToSign = {
    timestamp,
    folder
  };

  const signature =
    cloudinary.utils.api_sign_request(
      parametersToSign,
      process.env
        .CLOUDINARY_API_SECRET as string
    );

  return {
    timestamp,
    folder,
    signature,
    cloudName:
      process.env
        .CLOUDINARY_CLOUD_NAME as string,

    apiKey:
      process.env
        .CLOUDINARY_API_KEY as string
  };
}

export async function deleteStudentPhoto(
  publicId: string
): Promise<void> {
  if (!publicId.trim()) {
    return;
  }

  await cloudinary.uploader.destroy(
    publicId,
    {
      resource_type: "image",
      invalidate: true
    }
  );
}