import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedImageResult {
  uri: string;
  base64?: string;
}

/**
 * Compresses an image by resizing it to a maximum dimension of 1080px (maintaining aspect ratio),
 * and applying 70% JPEG compression.
 *
 * @param uri The local URI of the image to compress.
 * @param returnBase64 Whether to return the base64 representation of the compressed image.
 * @returns A promise resolving to the compressed image information.
 */
export const compressImageForUpload = async (
  uri: string,
  returnBase64: boolean = false,
): Promise<CompressedImageResult> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: returnBase64,
      },
    );

    return {
      uri: result.uri,
      base64: result.base64,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    // Fall back to original URI if something fails
    return { uri, base64: undefined };
  }
};
